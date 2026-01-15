export interface Service {
  id: string;
  name: string;
  description: string;
  icon: ServiceIcon;
  estimatedTime: string;
  price: string;
}
export type ServiceIcon =
  | 'smartphone'
  | 'battery-charging'
  | 'droplet'
  | 'plug'
  | 'camera'
  | 'volume-2'
  | 'settings'
  | 'power';
export const services: readonly Service[] = [
  {
    id: '1',
    name: 'Screen Replacement',
    description: 'Cracked or damaged screen repair',
    icon: 'smartphone',
    estimatedTime: '1-2 hours',
    price: '₹1,500 - ₹8,000',
  },
  {
    id: '2',
    name: 'Battery Replacement',
    description: 'Battery draining fast or not charging',
    icon: 'battery-charging',
    estimatedTime: '30 mins',
    price: '₹800 - ₹3,000',
  },
  {
    id: '3',
    name: 'Water Damage Repair',
    description: 'Device exposed to water or liquid',
    icon: 'droplet',
    estimatedTime: '2-4 hours',
    price: '₹2,000 - ₹10,000',
  },
  {
    id: '4',
    name: 'Charging Port Repair',
    description: 'Not charging or loose connection',
    icon: 'plug',
    estimatedTime: '1 hour',
    price: '₹500 - ₹2,000',
  },
  {
    id: '5',
    name: 'Camera Repair',
    description: 'Camera not working or blurry',
    icon: 'camera',
    estimatedTime: '1-2 hours',
    price: '₹1,500 - ₹5,000',
  },
  {
    id: '6',
    name: 'Speaker / Microphone',
    description: 'Audio issues or no sound',
    icon: 'volume-2',
    estimatedTime: '1 hour',
    price: '₹800 - ₹3,000',
  },
  {
    id: '7',
    name: 'Software Issues',
    description: 'Slow performance, bugs, crashes',
    icon: 'settings',
    estimatedTime: '30 mins - 2 hours',
    price: '₹500 - ₹2,000',
  },
  {
    id: '8',
    name: 'Button Repair',
    description: 'Power, volume, or home button issues',
    icon: 'power',
    estimatedTime: '1 hour',
    price: '₹500 - ₹1,500',
  },
];
export const deviceTypes: readonly string[] = [
  'iPhone',
  'Samsung Galaxy',
  'OnePlus',
  'Xiaomi',
  'Oppo',
  'Vivo',
  'Realme',
  'iPad',
  'Tablet',
  'Other',
];