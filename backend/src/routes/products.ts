import express from 'express';
import { supabase } from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, active = 'true' } = req.query;

    let query = supabase
      .from('products')
      .select('*, skus(*)')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (active === 'true') {
      query = query.eq('active', true);
    }

    const { data: products, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*, skus(*)')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, users(full_name, profile_image, city)')
      .eq('product_id', product.id)
      .eq('approved', true)
      .order('created_at', { ascending: false });

    res.json({ ...product, reviews });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/sku/:skuId', async (req, res) => {
  try {
    const { skuId } = req.params;

    const { data: sku, error } = await supabase
      .from('skus')
      .select('*, products(*)')
      .eq('id', skuId)
      .maybeSingle();

    if (error || !sku) {
      return res.status(404).json({ error: 'SKU not found' });
    }

    res.json(sku);
  } catch (error) {
    console.error('Get SKU error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
