export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  image_url?: string;
  category: string;
  inStock: boolean;
}
