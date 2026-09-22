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

export interface Activities {
  id: number;
  name?: string;
  description?: string;
  location?: string;
  event_date?: string;
    category_name?: string | null;

  price?: string;
  capacity?: number;
  is_active: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
}

export interface Concerts {
  id: number;
  name?: string;
  description?: string;
  location?: string;
  event_date?: string;
    category_name?: string | null;

  price?: string;
  capacity?: number;
  is_active: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
}


export interface Events {
  id : number;
  organizer_id?: number;
  city_id?: number;
  category_id?: number;
  category_name?: string | null;
  name?: string;
  slug?: string;
  description?: string;
  location?: string;
  event_date?: string;
  price?: string;
  capacity?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  is_active: boolean

}


export type Bookings = {
id: number;
user_id?: number;
booking_date: string;
pass_id?: number;
number_of_tickets?: number;
total_amount?: string;
status?: "CONFIRMED" | "CANCELLED"
}

export type BookingCategory = 'events' | 'activities' | 'concerts';

export interface Organizer {
  organization_name: string;
  name?: string;
  profile_image?: string | null;
  totalEvents?: number;
}
