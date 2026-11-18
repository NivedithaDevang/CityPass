import { RowDataPacket } from "mysql2";

// Core User & System Enums / Literals
export type UserRole = "USER" | "ORGANIZER" | "ADMIN" | "SUPER_ADMIN";
export type AccountStatus = "ACTIVE" | "INACTIVE";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

// JWT Payload Shape
export type AuthPayLoad = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  token_version: number;
  city_id: number | null;
};

// Database Query Rows (Extending RowDataPacket for mysql2)
export interface MetricCountRow extends RowDataPacket {
  total: number;
}

export interface MetricRevenueRow extends RowDataPacket {
  total: number | string;
}

export interface CityRow extends RowDataPacket {
  id: number;
  name: string;
  is_active: number | boolean;
}

export interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  is_active: number | boolean;
}

export interface EventRow extends RowDataPacket {
  id: number;
  name: string;
  location: string;
  price: string | number;
  is_active: number | boolean;
  event_date?: string;
  category_name?: string;
}

export interface OrganizerRequestRow extends RowDataPacket {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  organization: string;
  experience?: string;
  reason?: string;
  status: RequestStatus;
  created_at?: string;
}

export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  created_at?: string;
}

// Aggregated Dashboard Response Payload
export interface AdminDashboardPayload {
  metrics: {
    totalUsers: number;
    activeEvents: number;
    ticketsSold: number;
    totalRevenue: number;
    pendingRequests: number;
  };
  cities: CityRow[];
  categories: CategoryRow[];
  events: EventRow[];
  organizerRequests: OrganizerRequestRow[];
  recentUsers: UserRow[];
}

// Reusable Generic API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}