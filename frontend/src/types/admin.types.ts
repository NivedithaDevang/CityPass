export type UserRole = "USER" | "ORGANIZER" | "ADMIN" | "SUPER_ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface AdminStat {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
}