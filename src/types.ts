export interface Product {
  id: string;
  name: string;
  description: string;
  slug: string;
  images: string[];
  category: 'BLACK_SOAP' | 'KERNEL_OIL';
  active: boolean;
  skus: Sku[];
  reviews?: Review[];
}

export interface Sku {
  id: string;
  product_id: string;
  size_label: string;
  size_unit: string;
  size_value: number;
  price: number;
  stock: number;
}

export interface CartItem {
  sku: Sku;
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  isAffiliate: boolean;
  affiliateApproved?: boolean;
  affiliateBalance?: number;
}

export interface Order {
  id: string;
  order_number: number;
  order_id_string: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  shipping_info: ShippingInfo;
  order_items: OrderItem[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  skus: Sku & { products: Product };
}

export interface ShippingInfo {
  full_name: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  address: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  users?: {
    full_name: string;
    profile_image?: string;
    city: string;
  };
}

export interface StateCity {
  name: string;
  cities: string[];
}
