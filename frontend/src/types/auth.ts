export interface User {
  id: string;
  name?: string;
  email: string;
  role?: string;
  phone?: string | null;
  dob?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  status?: "ACTIVE" | "INACTIVE";
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => Promise<void>;
}

export interface City {
  id: number;
  name: string;
  description: string;
  is_active: boolean
}

export interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean
}

export interface Events {
  id : number;
  organizer_id?: number;
  city_id?: number;
  category_id?: number;
  category_name?: string | null;
  name?: string;
  description?: string;
  location?: string;
  event_date?: string;
  price?: string;
  capacity?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  is_active: boolean

}

export type BookingCategory = 'events' | 'activities' | 'concerts';