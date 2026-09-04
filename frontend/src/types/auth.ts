export interface User {
  id: string;
  name?: string;
  email: string;
  role?: string
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => Promise<void>;
}

export type BookingCategory = 'events' | 'activities' | 'concerts';