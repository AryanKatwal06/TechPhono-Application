export type RepairStatus =
  | 'received'
  | 'diagnosing'
  | 'repairing'
  | 'repaired'
  | 'completed'
  | 'cancelled';
export interface Repair {
  id: string;
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
}
export interface Database {
  public: {
    Tables: {
      repairs: {
        Row: {
          id: string;
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
        };
        Insert: {
          job_id: string;
          name: string;
          phone: string;
          device_type: string;
          model?: string | null;
          issue: string;
          service: string;
          status?: RepairStatus;
          admin_notes?: string | null;
          rating?: number | null;
          feedback?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
        };
        Update: {
          status?: RepairStatus;
          admin_notes?: string | null;
          rating?: number | null;
          feedback?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          updated_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          description?: string;
          price: number;
          image_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_active?: boolean;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          description?: string;
          price: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          is_active?: boolean;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          phone: string | null;
          avatar_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          email?: string | null;
          name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
      };
      otp_codes: {
        Row: {
          id: string;
          phone: string;
          code: string;
          created_at: string;
          expires_at: string;
          verified: boolean;
        };
        Insert: {
          phone: string;
          code: string;
          expires_at: string;
          verified?: boolean;
        };
        Update: {
          verified?: boolean;
          expires_at?: string;
        };
      };
    };
  };
}