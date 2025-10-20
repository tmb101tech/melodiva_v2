export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  password_hash: string;
  profile_image?: string;
  security_question: string;
  security_answer_hash: string;
  address: string;
  state: string;
  city: string;
  is_affiliate: boolean;
  affiliate_code?: string;
  affiliate_approved: boolean;
  affiliate_balance: number;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
  images: string[];
  category: 'BLACK_SOAP' | 'KERNEL_OIL';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sku {
  id: string;
  product_id: string;
  size_label: string;
  size_unit: string;
  size_value: number;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  order_id_string: string;
  user_id: string;
  shipping_id: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  affiliate_code?: string;
  affiliate_id?: string;
  payment_status: 'PENDING' | 'PAID' | 'FAILED';
  order_status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'COMPLETED';
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  sku_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface ShippingInfo {
  id?: string;
  user_id?: string;
  full_name: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  address: string;
}

export interface CartItem {
  sku_id: string;
  quantity: number;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  comment?: string;
  approved: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  order_id?: string;
  user_id: string;
  type: 'PAYMENT' | 'REFUND' | 'COMMISSION' | 'WITHDRAWAL' | 'ADJUSTMENT';
  amount: number;
  reference?: string;
  metadata?: any;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  description?: string;
  updated_at: string;
}

export interface StateCity {
  name: string;
  cities: string[];
}
