import axios from "axios";
import { API_BASE_URL } from "../config/config";

export interface OrganiserEvent {
  id: number;
  organizer_id: number;
  city_id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  event_date: string;
  time: string;
  price: number;
  capacity: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  category_name: string | null;
  city_name?: string | null;
}

export interface BookingAttendee {
  booking_id: number;
  event_name: string;
  user_name: string;
  user_email: string;
  tickets_booked: number;
  total_paid: number;
  booking_date: string;
}

export interface OrganiserStats {
  totalEvents: number;
  approvedEvents: number;
  pendingEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
}

const organiserApi = axios.create({
  baseURL: `${API_BASE_URL}/v1/organisers`,
  withCredentials: true,
});

export const fetchMyEvents = async (): Promise<OrganiserEvent[]> => {
  const response = await organiserApi.get("/events");
  return response.data.events;
};

export const createOrganiserEvent = async (
  data: Partial<OrganiserEvent>
) => {
  const response = await organiserApi.post("/events", data);
  return response.data;
};

export const fetchOrganiserBookings = async (): Promise<BookingAttendee[]> => {
  const response = await organiserApi.get("/bookings");
  return response.data.bookings;
};

export const fetchOrganiserDashboardStats =
  async (): Promise<OrganiserStats> => {
    const response = await organiserApi.get("/dashboard-stats");
    return response.data.stats;
  };

export default organiserApi;