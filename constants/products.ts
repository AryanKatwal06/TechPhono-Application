export type ProductCategory =
  | 'Accessories'
  | 'Chargers'
  | 'Cables'
  | 'Audio';
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: ProductCategory;
  inStock: boolean;
}
export const products: readonly Product[] = [
  {
    id: '1',
    name: 'Tempered Glass Screen Protector',
    description: '9H hardness, anti-scratch protection',
    price: 299,
    image:
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400',
    category: 'Accessories',
    inStock: true,
  },
  {
    id: '2',
    name: 'Silicone Phone Case',
    description: 'Soft, durable, shockproof case',
    price: 499,
    image:
      'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400',
    category: 'Accessories',
    inStock: true,
  },
  {
    id: '3',
    name: 'Fast Charger 20W',
    description: 'Quick charge compatible',
    price: 899,
    image:
      'https://images.unsplash.com/photo-1591290619762-c588f0069c1e?w=400',
    category: 'Chargers',
    inStock: true,
  },
  {
    id: '4',
    name: 'USB-C Cable',
    description: 'Durable braided cable, 1.5m',
    price: 399,
    image:
      'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400',
    category: 'Cables',
    inStock: true,
  },
  {
    id: '5',
    name: 'Wireless Earbuds',
    description: 'Bluetooth 5.0, 24hr battery',
    price: 1999,
    image:
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    category: 'Audio',
    inStock: true,
  },
  {
    id: '6',
    name: 'Phone Stand',
    description: 'Adjustable aluminum stand',
    price: 699,
    image:
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
    category: 'Accessories',
    inStock: true,
  },
];