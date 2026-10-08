import axios from "axios";
import { API_BASE_URL } from "../config/config";

export type OrganiserEvent = {
  id: number;
  organizer_id: number;
  city_id: number;
  category_id: number;
  name: string;
  image?: string | null;
  description: string | null;
  location: string | null;
  event_date: string;
  time: string;
  price: number;
  capacity: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  slug: string;
  category_name: string | null;
  city_name: string | null;
  rejection_reason?: string | null;
};

export interface CreateOrganiserEventData {
  city_id: number;
  category_id: number;
  name: string;
  description?: string;
  location?: string;
  event_date: string;
  time: string;
  price: number;
  capacity: number;
  image?: File;
}

export interface OrganiserLookupOption {
  id: number;
  name: string;
  is_active?: boolean;
}

export interface OrganiserBooking {
  booking_id: number;
  event_id: number;
  event_name: string;
  user_name: string | null;
  user_email: string | null;
  number_of_tickets: number;
  total_amount: number;
  booking_date: string;
  booking_status: string | null;
}

export const getOrganiserErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

const organiserApi = axios.create({
  baseURL: `${API_BASE_URL}/v1/organisers`,
  withCredentials: true,
});

const lookupApi = axios.create({
  baseURL: `${API_BASE_URL}/v1`,
  withCredentials: true,
});

export const fetchMyEvents = async (): Promise<OrganiserEvent[]> => {
  const response = await organiserApi.get("/events");
  return response.data.events || [];
};

export const fetchOrganiserBookings = async (): Promise<OrganiserBooking[]> => {
  const response = await organiserApi.get("/bookings");
  return response.data.bookings || [];
};

export const createOrganiserEvent = async (
  data: CreateOrganiserEventData
): Promise<OrganiserEvent> => {

  const formData = new FormData();

  formData.append("city_id", String(data.city_id));
  formData.append("category_id", String(data.category_id));
  formData.append("name", data.name);
  formData.append("description", data.description || "");
  formData.append("location", data.location || "");
  formData.append("event_date", data.event_date);
  formData.append("time", data.time);
  formData.append("price", String(data.price));
  formData.append("capacity", String(data.capacity));

  if (data.image) {
    formData.append("image", data.image);
  }

  const response = await organiserApi.post(
    "/add-event",
    formData
  );

  return response.data.event;
};

export const patchOrganiserEvent = async (
  eventId: number | string,
  updates: Record<string, any>
): Promise<OrganiserEvent> => {
  const formData = new FormData();

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value instanceof File ? value : String(value));
    }
  });

  const response = await axios.patch(
    `${API_BASE_URL}/v1/organiser/events/${eventId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }
  );

  return response.data.event;
};

export const fetchOrganiserCities = async (): Promise<OrganiserLookupOption[]> => {
  const response = await lookupApi.get("/cities");
  return response.data.cities || [];
};

export const fetchOrganiserCategories = async (): Promise<OrganiserLookupOption[]> => {
  const response = await lookupApi.get("/categories");
  return response.data.categories || [];
};

export default organiserApi;