// Database types - Firebase/Firestore compatible
// These types define the document shapes used in Firestore collections

export type RepairStatus =
  | 'Pending'
  | 'Received'
  | 'Diagnosing'
  | 'Repairing'
  | 'Repaired'
  | 'Completed'
  | 'Cancelled'
  | 'pending'
  | 'received'
  | 'diagnosing'
  | 'repairing'
  | 'repaired'
  | 'completed'
  | 'cancelled';

export interface Repair {
  id: string;          // Firestore document ID
  job_id: string;
  name: string;
  phone: string;
  device_type: string;
  model: string | null;
  issue: string;
  service: string;
  status: RepairStatus;
  created_at: string;
  admin_notes: string | null;
  rating: number | null;
  feedback: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  user_id?: string;    // Firebase Auth UID
  updated_at?: string;
}

export interface Item {
  id: string;          // Firestore document ID
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
  is_deleted?: boolean;
  created_at: string;
}

export interface Service {
  id: string;          // Firestore document ID
  name: string;
  description: string;
  price: number;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserProfile {
  email: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  updated_at: string;
}