
import axios from "axios";
import { API_BASE_URL } from "../config/config";

export type OrganiserEvent = {
  id: number;
  organizer_id: number;
  city_id: number;
  category_id: number;
  name: string;
  image?: string | null;
  image_url?: string | null;
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
  languages?: string | string[] | null;
  age_group?: string | null;
  age_restriction?: string | null;
  duration_hours?: number | string | null;
  duration?: string | null;
  additional_instructions?: string | null;
  instructions?: string | null;
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
  // Add the new fields:
  instructions?: string;
  additional_instructions?: string;
  languages?: string | string[];
  age_restriction?: string;
  age_group?: string;
  duration?: string;
  duration_hours?: number;
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

export interface AdminTicketTemplate {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  status: "ACTIVE" | "DELETED";
}

const organiserApi = axios.create({
  baseURL: `${API_BASE_URL}/v1/organisers`,
  withCredentials: true,
});

const lookupApi = axios.create({
  baseURL: `${API_BASE_URL}/v1`,
  withCredentials: true,
});

export const fetchActiveAdminTickets = async (): Promise<AdminTicketTemplate[]> => {
  const response = await lookupApi.get("/tickets");
  return response.data?.tickets || [];
};

export const getOrganiserErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

export const fetchMyEvents = async (): Promise<OrganiserEvent[]> => {
  const response = await organiserApi.get("/events");
  return response.data.events || [];
};

export const fetchOrganiserBookings = async (): Promise<OrganiserBooking[]> => {
  const response = await organiserApi.get("/bookings");
  return response.data.bookings || [];
};

export const createOrganiserEvent = async (
  data: CreateOrganiserEventData & {
    ticket_category_name?: string;
    ticket_tiers?: string;
  }
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

  // --- Append the missing instruction & badge fields ---
  const instructions = data.additional_instructions || data.instructions;
  if (instructions) {
    formData.append("additional_instructions", instructions);
    formData.append("instructions", instructions);
  }

  const ageGroup = data.age_group || data.age_restriction;
  if (ageGroup) {
    formData.append("age_group", ageGroup);
    formData.append("age_restriction", ageGroup);
  }

  const durationVal = data.duration_hours !== undefined ? String(data.duration_hours) : data.duration;
  if (durationVal) {
    formData.append("duration", String(durationVal));
    formData.append("duration_hours", String(durationVal));
  }

  if (data.languages) {
    const langs = Array.isArray(data.languages) ? JSON.stringify(data.languages) : data.languages;
    formData.append("languages", langs);
  }

  if (data.ticket_category_name !== undefined) {
    formData.append("ticket_category_name", data.ticket_category_name);
  }

  if (data.ticket_tiers !== undefined) {
    formData.append("ticket_tiers", data.ticket_tiers);
  }

  if (data.image) {
    formData.append("image", data.image);
  }

  const response = await organiserApi.post("/add-event", formData);
  return response.data.event;
};


export const patchOrganiserEvent = async (
  eventId: number | string,
  updates: Record<string, unknown>
): Promise<OrganiserEvent> => {
  const formData = new FormData();

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (value instanceof Blob) {
      formData.append(key, value);
    } else if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  const response = await organiserApi.patch(
    `/edit-event/${eventId}`,
    formData
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
