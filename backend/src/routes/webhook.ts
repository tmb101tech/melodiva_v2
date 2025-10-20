import express from 'express';
import crypto from 'crypto';
import { supabase } from '../config/database.js';
import { calculateCommission } from '../utils/helpers.js';

const router = express.Router();

router.post('/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      const orderId = metadata.order_id;

      const { data: existingOrder } = await supabase
        .from('orders')
        .select('payment_status')
        .eq('id', orderId)
        .eq('payment_reference', reference)
        .maybeSingle();

      if (!existingOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (existingOrder.payment_status === 'PAID') {
        return res.status(200).json({ message: 'Already processed' });
      }

      const { data: order } = await supabase
        .from('orders')
        .select('*, order_items(*), users(email)')
        .eq('id', orderId)
        .single();

      await supabase
        .from('orders')
        .update({
          payment_status: 'PAID',
          order_status: 'PROCESSING'
        })
        .eq('id', orderId);

      for (const item of order.order_items) {
        await supabase.rpc('decrement_sku_stock', {
          sku_id: item.sku_id,
          quantity: item.quantity
        });
      }

      await supabase.from('transactions').insert({
        user_id: order.user_id,
        order_id: order.id,
        type: 'PAYMENT',
        amount: order.total,
        reference,
        metadata: { payment_method: 'paystack' },
        status: 'COMPLETED'
      });

      if (order.affiliate_id) {
        const items = order.order_items.map((item: any) => ({
          sku_id: item.sku_id,
          quantity: item.quantity
        }));

        const commission = await calculateCommission(items);

        if (commission > 0) {
          await supabase.rpc('increment_affiliate_balance', {
            user_id: order.affiliate_id,
            amount: commission
          });

          await supabase.from('referrals').insert({
            affiliate_id: order.affiliate_id,
            buyer_email: order.users.email,
            order_id: order.id,
            commission_amount: commission
          });

          await supabase.from('transactions').insert({
            user_id: order.affiliate_id,
            order_id: order.id,
            type: 'COMMISSION',
            amount: commission,
            reference: `COMM-${order.order_id_string}`,
            metadata: { order_number: order.order_id_string },
            status: 'COMPLETED'
          });
        }
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } else {
      res.status(200).json({ message: 'Event received' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
