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

export const CATEGORIES = ['Accessories', 'Parts', 'Tools', 'Other'] as const;

export type Category = typeof CATEGORIES[number];
