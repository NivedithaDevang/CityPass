import axios from "axios";
import { API_BASE_URL } from "../config/config";

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/v1/admin`,
  withCredentials: true,
});

/* USERS */

export const fetchAdminUsers = async () => {
  const response = await adminApi.get("/users");
  return response.data;
};

/* EVENTS */

export const fetchAdminEvents = async () => {
  const response = await adminApi.get("/events");
  return response.data;
};

/* ORGANISER REQUESTS */

export const fetchAdminOrganiserRequests = async (
  status?: string
) => {
  const params =
    status && status !== "ALL"
      ? { status }
      : {};

  const response = await adminApi.get(
    "/organiser-requests",
    { params }
  );

  return response.data;
};

export const updateOrganizerStatus = async (
  requestId: number,
  status: string
) => {
  const response = await adminApi.patch(
    `/organiser-requests/${requestId}/status`,
    { status }
  );

  return response.data;
};

/* ORGANISERS */

export const fetchAdminOrganisers = async () => {
  const response = await adminApi.get("/organisers");
  return response.data;
};

/* CITIES */

export const fetchAdminCities = async () => {
  const response = await adminApi.get("/cities");
  return response.data;
};

export const addCity = async (
  name: string,
  description: string
) => {
  const response = await adminApi.post(
    "/add-city",
    {
      name,
      description,
    }
  );

  return response.data;
};

export const updateCityStatus = async (
  cityId: number,
  status: "ACTIVE" | "INACTIVE"
) => {
  const response = await adminApi.patch(
    `/cities/${cityId}`,
    {
      is_active: status === "ACTIVE",
    }
  );

  return response.data;
};

export const updateCity = async (
  cityId: number,
  data: {
    name?: string;
    description?: string;
    is_active?: boolean;
  }
) => {
  const response = await adminApi.patch(
    `/cities/${cityId}`,
    data
  );

  return response.data;
};

/* CATEGORIES */

export const fetchAdminCategories = async () => {
  const response = await adminApi.get(
    "/categories"
  );

  return response.data;
};

export const addCategory = async (
  name: string
) => {
  const response = await adminApi.post(
    "/add-category",
    {
      name,
    }
  );

  return response.data;
};

export const updateCategory = async (
  categoryId: number,
  data: {
    name?: string;
    is_active?: boolean;
  }
) => {
  const response = await adminApi.patch(
    `/categories/${categoryId}`,
    data
  );

  return response.data;
};

/* EVENTS STATUS */

export const updateEventStatus = async (
  eventId: number,
  status: string
) => {
  const response = await adminApi.patch(
    `/events/${eventId}/status`,
    {
      status,
    }
  );

  return response.data;
};

/* TICKETS */

export const fetchAdminTickets = async () => {
  const response = await adminApi.get("/tickets");

  return response.data;
};

export const addAdminTicket = async (data: {
  name: string;
  description?: string;
  price: number;
  category: string;
}) => {
  const response = await adminApi.post(
    "/add-ticket",
    data
  );

  return response.data;
};

export const deleteAdminTicket = async (
  ticketId: number
) => {
  const response = await adminApi.patch(
    `/tickets/${ticketId}/delete`
  );

  return response.data;
};