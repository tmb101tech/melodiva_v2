import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateUser, AuthRequest } from '../utils/auth.js';

const router = express.Router();

router.post('/', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('user_id', req.user!.userId)
      .eq('order_status', 'COMPLETED')
      .maybeSingle();

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not completed' });
    }

    const productInOrder = order.order_items.some(
      (item: any) => item.products?.id === productId
    );

    if (!productInOrder) {
      const { data: items } = await supabase
        .from('order_items')
        .select('*, skus(*, products(*))')
        .eq('order_id', orderId);

      const hasProduct = items?.some(
        (item: any) => item.skus?.products?.id === productId
      );

      if (!hasProduct) {
        return res.status(400).json({ error: 'Product not in this order' });
      }
    }

    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', req.user!.userId)
      .eq('order_id', orderId)
      .maybeSingle();

    if (existingReview) {
      return res.status(400).json({ error: 'Review already submitted for this product' });
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        user_id: req.user!.userId,
        order_id: orderId,
        rating,
        comment,
        approved: false
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to submit review' });
    }

    res.status(201).json({
      message: 'Review submitted successfully. Awaiting approval.',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, users(full_name, profile_image, city)')
      .eq('product_id', productId)
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    res.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/my-reviews', authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, products(name, images), orders(order_id_string)')
      .eq('user_id', req.user!.userId)
      .order('created_at', { ascending: false});

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    res.json(reviews);
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
