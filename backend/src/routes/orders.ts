import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateUser, AuthRequest } from '../utils/auth.js';
import {
  calculateCommission,
  getDeliveryFee,
  getAffiliateDiscount
} from '../utils/helpers.js';
import axios from 'axios';

const router = express.Router();

router.post('/calculate-checkout', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { items, shippingInfo, affiliateCode, useWalletBalance } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let subtotal = 0;
    const itemsWithPrices = [];

    for (const item of items) {
      const { data: sku } = await supabase
        .from('skus')
        .select('*, products(*)')
        .eq('id', item.sku_id)
        .maybeSingle();

      if (!sku) {
        return res.status(400).json({ error: `SKU ${item.sku_id} not found` });
      }

      if (sku.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${sku.products.name} - ${sku.size_label}`
        });
      }

      const lineTotal = sku.price * item.quantity;
      subtotal += lineTotal;

      itemsWithPrices.push({
        sku_id: sku.id,
        quantity: item.quantity,
        unit_price: sku.price,
        line_total: lineTotal,
        name: sku.products.name,
        size: sku.size_label
      });
    }

    let discount = 0;
    let affiliateId = null;

    if (affiliateCode) {
      const { data: affiliate } = await supabase
        .from('users')
        .select('id, affiliate_approved')
        .eq('affiliate_code', affiliateCode.toUpperCase())
        .maybeSingle();

      if (affiliate && affiliate.affiliate_approved) {
        const discountPercentage = await getAffiliateDiscount();
        discount = Math.round((subtotal * discountPercentage) / 100);
        affiliateId = affiliate.id;
      }
    }

    const deliveryFee = await getDeliveryFee(shippingInfo.state, shippingInfo.city);

    let walletDeduction = 0;
    if (useWalletBalance) {
      const { data: user } = await supabase
        .from('users')
        .select('affiliate_balance')
        .eq('id', req.user!.userId)
        .maybeSingle();

      if (user && user.affiliate_balance > 0) {
        walletDeduction = Math.min(user.affiliate_balance, subtotal - discount);
      }
    }

    const total = subtotal - discount - walletDeduction + deliveryFee;

    res.json({
      subtotal,
      discount,
      walletDeduction,
      deliveryFee,
      total,
      items: itemsWithPrices,
      affiliateId
    });
  } catch (error) {
    console.error('Calculate checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/create', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { items, shippingInfo, affiliateCode, useWalletBalance } = req.body;

    const calculation = await axios.post(
      `http://localhost:${process.env.PORT || 3001}/api/orders/calculate-checkout`,
      { items, shippingInfo, affiliateCode, useWalletBalance },
      {
        headers: {
          Authorization: req.headers.authorization
        }
      }
    );

    const { subtotal, discount, walletDeduction, deliveryFee, total, affiliateId } =
      calculation.data;

    const { data: shipping, error: shippingError } = await supabase
      .from('shipping_info')
      .insert({
        user_id: req.user!.userId,
        full_name: shippingInfo.fullName,
        phone: shippingInfo.phone,
        email: shippingInfo.email,
        state: shippingInfo.state,
        city: shippingInfo.city,
        address: shippingInfo.address
      })
      .select()
      .single();

    if (shippingError) {
      return res.status(500).json({ error: 'Failed to save shipping info' });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: req.user!.userId,
        shipping_id: shipping.id,
        subtotal,
        discount,
        delivery_fee: deliveryFee,
        total,
        affiliate_code: affiliateCode?.toUpperCase() || null,
        affiliate_id: affiliateId,
        payment_status: 'PENDING',
        order_status: 'PENDING'
      })
      .select()
      .single();

    if (orderError) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    for (const item of items) {
      const { data: sku } = await supabase
        .from('skus')
        .select('price')
        .eq('id', item.sku_id)
        .single();

      if (!sku) {
        return res.status(400).json({ error: 'SKU not found' });
      }

      await supabase.from('order_items').insert({
        order_id: order.id,
        sku_id: item.sku_id,
        quantity: item.quantity,
        unit_price: sku.price,
        line_total: sku.price * item.quantity
      });
    }

    if (walletDeduction > 0) {
      await supabase.rpc('decrement_affiliate_balance', {
        user_id: req.user!.userId,
        amount: walletDeduction
      });

      await supabase.from('transactions').insert({
        user_id: req.user!.userId,
        order_id: order.id,
        type: 'PAYMENT',
        amount: -walletDeduction,
        reference: `WALLET-${order.order_id_string}`,
        metadata: { source: 'wallet_balance' },
        status: 'COMPLETED'
      });
    }

    if (total > 0) {
      const paystackResponse = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: req.user!.email,
          amount: total * 100,
          reference: `MEL-${order.order_number}-${Date.now()}`,
          metadata: {
            order_id: order.id,
            order_number: order.order_id_string
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await supabase
        .from('orders')
        .update({ payment_reference: paystackResponse.data.data.reference })
        .eq('id', order.id);

      res.status(201).json({
        message: 'Order created successfully',
        order: {
          id: order.id,
          orderNumber: order.order_id_string,
          total,
          paymentUrl: paystackResponse.data.data.authorization_url
        }
      });
    } else {
      await supabase
        .from('orders')
        .update({ payment_status: 'PAID', order_status: 'PROCESSING' })
        .eq('id', order.id);

      res.status(201).json({
        message: 'Order created and paid with wallet',
        order: {
          id: order.id,
          orderNumber: order.order_id_string,
          total: 0
        }
      });
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/my-orders', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('orders')
      .select('*, shipping_info(*), order_items(*, skus(*, products(*)))')
      .eq('user_id', req.user!.userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('order_status', status);
    }

    const { data: orders, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:orderId', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, shipping_info(*), order_items(*, skus(*, products(*)))')
      .eq('id', orderId)
      .eq('user_id', req.user!.userId)
      .maybeSingle();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
