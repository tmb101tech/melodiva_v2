import { supabase } from '../config/database.js';
import { Product, Sku } from '../types/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const calculateCommission = async (
  orderItems: Array<{ sku_id: string; quantity: number }>
): Promise<number> => {
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .in('key', ['affiliate_commission_black_soap', 'affiliate_commission_kernel_oil']);

  const commissionSettings: Record<string, any> = {};
  settings?.forEach((s) => {
    commissionSettings[s.key] = s.value;
  });

  let totalCommission = 0;

  for (const item of orderItems) {
    const { data: sku } = await supabase
      .from('skus')
      .select('*, products(*)')
      .eq('id', item.sku_id)
      .maybeSingle();

    if (!sku || !sku.products) continue;

    const product = sku.products as Product;
    const totalSize = sku.size_value * item.quantity;

    if (product.category === 'BLACK_SOAP') {
      const config = commissionSettings['affiliate_commission_black_soap'];
      const commissionPerUnit = config.amount / config.per_unit;
      totalCommission += (totalSize / 1) * commissionPerUnit;
    } else if (product.category === 'KERNEL_OIL') {
      const config = commissionSettings['affiliate_commission_kernel_oil'];
      const commissionPerUnit = config.amount / config.per_unit;
      totalCommission += (totalSize / 1) * commissionPerUnit;
    }
  }

  return Math.round(totalCommission * 100) / 100;
};

export const getDeliveryFee = async (state: string, city: string): Promise<number> => {
  const { data: setting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'delivery_fees')
    .maybeSingle();

  if (!setting || !setting.value) {
    return 2000;
  }

  const fees = setting.value as Record<string, Record<string, number>>;

  if (fees[state] && fees[state][city]) {
    return fees[state][city];
  }

  if (fees[state] && fees[state]['default']) {
    return fees[state]['default'];
  }

  return 2000;
};

export const getAffiliateDiscount = async (): Promise<number> => {
  const { data: setting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'affiliate_discount_percentage')
    .maybeSingle();

  return setting?.value || 5;
};

export const loadStatesCities = (): Array<{ name: string; cities: string[] }> => {
  const dataPath = path.join(__dirname, '../../data/states_cities (1).json');
  const data = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(data);
};

export const validateStateCity = (state: string, city: string): boolean => {
  const statesCities = loadStatesCities();
  const stateData = statesCities.find((s) => s.name === state);

  if (!stateData) return false;

  return stateData.cities.includes(city);
};

export const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};
