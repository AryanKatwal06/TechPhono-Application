import type { Product } from '@/constants/products';
export interface CartItem {
  product: Product;
  quantity: number;
}