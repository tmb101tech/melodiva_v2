import express from 'express';
import { supabase } from '../config/database.js';
import {
  hashPassword,
  comparePassword,
  generateAdminToken,
  authenticateAdmin,
  AuthRequest
} from '../utils/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await comparePassword(password, admin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateAdminToken({ adminId: admin.id, username: admin.username });

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/dashboard/stats', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { period = 'all' } = req.query;

    let dateFilter = '';
    const now = new Date();

    switch (period) {
      case 'daily':
        now.setHours(0, 0, 0, 0);
        dateFilter = now.toISOString();
        break;
      case 'weekly':
        now.setDate(now.getDate() - 7);
        dateFilter = now.toISOString();
        break;
      case 'monthly':
        now.setMonth(now.getMonth() - 1);
        dateFilter = now.toISOString();
        break;
      case 'yearly':
        now.setFullYear(now.getFullYear() - 1);
        dateFilter = now.toISOString();
        break;
    }

    let ordersQuery = supabase
      .from('orders')
      .select('*, order_items(*)');

    if (dateFilter) {
      ordersQuery = ordersQuery.gte('created_at', dateFilter);
    }

    const { data: orders } = await ordersQuery;

    const { data: users, count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact' });

    const { data: affiliates, count: totalAffiliates } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('is_affiliate', true);

    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
    const totalOrders = orders?.length || 0;
    const completedOrders = orders?.filter(o => o.order_status === 'COMPLETED').length || 0;
    const pendingOrders = orders?.filter(o => o.order_status === 'PENDING').length || 0;
    const processingOrders = orders?.filter(o => o.order_status === 'PROCESSING').length || 0;

    res.json({
      totalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      processingOrders,
      totalUsers,
      totalAffiliates
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/orders', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('orders')
      .select('*, users(full_name, email, phone), shipping_info(*), order_items(*, skus(*, products(*)))', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('order_status', status);
    }

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: orders, error, count } = await query.range(from, to);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({
      orders,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/orders/:orderId/status', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'COMPLETED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update order status' });
    }

    await supabase.from('audit_logs').insert({
      admin_id: req.admin!.adminId,
      action: `Updated order ${order.order_id_string} status to ${status}`,
      entity_type: 'order',
      entity_id: orderId,
      new_values: { order_status: status }
    });

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: users, error, count } = await query.range(from, to);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    const sanitizedUsers = users.map(({ password_hash, security_answer_hash, ...user }) => user);

    res.json({
      users: sanitizedUsers,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/:userId/status', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update user status' });
    }

    await supabase.from('audit_logs').insert({
      admin_id: req.admin!.adminId,
      action: `Updated user ${user.email} status to ${status}`,
      entity_type: 'user',
      entity_id: userId,
      new_values: { status }
    });

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/affiliates', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { approved, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('users')
      .select('*, referrals(commission_amount)', { count: 'exact' })
      .eq('is_affiliate', true)
      .order('created_at', { ascending: false });

    if (approved !== undefined) {
      query = query.eq('affiliate_approved', approved === 'true');
    }

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: affiliates, error, count } = await query.range(from, to);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch affiliates' });
    }

    const sanitizedAffiliates = affiliates.map(({ password_hash, security_answer_hash, ...affiliate }) => ({
      ...affiliate,
      totalEarnings: affiliate.referrals?.reduce((sum: number, ref: any) => sum + parseFloat(ref.commission_amount), 0) || 0
    }));

    res.json({
      affiliates: sanitizedAffiliates,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get affiliates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/affiliates/:userId/approve', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { approved } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({ affiliate_approved: approved })
      .eq('id', userId)
      .eq('is_affiliate', true)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update affiliate status' });
    }

    await supabase.from('audit_logs').insert({
      admin_id: req.admin!.adminId,
      action: `${approved ? 'Approved' : 'Disapproved'} affiliate ${user.email}`,
      entity_type: 'user',
      entity_id: userId,
      new_values: { affiliate_approved: approved }
    });

    res.json({ message: `Affiliate ${approved ? 'approved' : 'disapproved'} successfully` });
  } catch (error) {
    console.error('Update affiliate approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reviews', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { approved, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('reviews')
      .select('*, users(full_name, email), products(name), orders(order_id_string)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (approved !== undefined) {
      query = query.eq('approved', approved === 'true');
    }

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: reviews, error, count } = await query.range(from, to);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    res.json({
      reviews,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/reviews/:reviewId/approve', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { reviewId } = req.params;
    const { approved } = req.body;

    const { error } = await supabase
      .from('reviews')
      .update({ approved })
      .eq('id', reviewId);

    if (error) {
      return res.status(500).json({ error: 'Failed to update review' });
    }

    await supabase.from('audit_logs').insert({
      admin_id: req.admin!.adminId,
      action: `${approved ? 'Approved' : 'Rejected'} review`,
      entity_type: 'review',
      entity_id: reviewId,
      new_values: { approved }
    });

    res.json({ message: `Review ${approved ? 'approved' : 'rejected'} successfully` });
  } catch (error) {
    console.error('Update review approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/settings', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .order('key');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/settings/:key', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const { data: setting, error } = await supabase
      .from('settings')
      .update({ value })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update setting' });
    }

    await supabase.from('audit_logs').insert({
      admin_id: req.admin!.adminId,
      action: `Updated setting: ${key}`,
      entity_type: 'setting',
      entity_id: setting.id,
      new_values: { value }
    });

    res.json({ message: 'Setting updated successfully', setting });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/audit-logs', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: logs, error, count } = await supabase
      .from('audit_logs')
      .select('*, admins(username)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }

    res.json({
      logs,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
