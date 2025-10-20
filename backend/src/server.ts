import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import affiliateRoutes from './routes/affiliate.js';
import adminRoutes from './routes/admin.js';
import webhookRoutes from './routes/webhook.js';
import reviewsRoutes from './routes/reviews.js';
import { supabase } from './config/database.js';
import { hashPassword } from './utils/auth.js';
import { loadStatesCities } from './utils/helpers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/reviews', reviewsRoutes);

app.get('/api/states-cities', (req, res) => {
  try {
    const statesCities = loadStatesCities();
    res.json(statesCities);
  } catch (error) {
    console.error('Get states/cities error:', error);
    res.status(500).json({ error: 'Failed to load states and cities' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Melodiva API is running' });
});

const initializeDatabase = async () => {
  try {
    const { data: adminExists } = await supabase
      .from('admins')
      .select('id')
      .maybeSingle();

    if (!adminExists) {
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = await hashPassword(adminPassword);

      await supabase.from('admins').insert({
        username: adminUsername,
        password_hash: passwordHash
      });

      console.log('✅ Admin user created');
      console.log(`Username: ${adminUsername}`);
      console.log(`Password: ${adminPassword}`);
    }

    const { data: deliveryFeesExists } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'delivery_fees')
      .maybeSingle();

    if (deliveryFeesExists) {
      const defaultDeliveryFees: any = {
        Lagos: { default: 1500 },
        'FCT': { default: 2000 },
        Ogun: { default: 2000 },
        Kano: { default: 2500 },
        Rivers: { default: 2500 }
      };

      await supabase
        .from('settings')
        .update({ value: defaultDeliveryFees })
        .eq('key', 'delivery_fees');

      console.log('✅ Default delivery fees configured');
    }

    await supabase.rpc('create_increment_affiliate_balance_function', {}, { count: 'exact' });
    await supabase.rpc('create_decrement_affiliate_balance_function', {}, { count: 'exact' });
    await supabase.rpc('create_decrement_sku_stock_function', {}, { count: 'exact' });

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

app.listen(PORT, async () => {
  console.log(`🚀 Melodiva API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  await initializeDatabase();
});

export default app;
