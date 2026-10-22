import axios from "axios";
import { API_BASE_URL } from "../config/config";

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/v1/admin`,
  withCredentials: true,
});

export const verifySuperAdminKey = async (secretKey: string) => {
  const response = await adminApi.post("/verify-super-admin-key", { secretKey });
  return response.data;
};


export const fetchAdminUsers = async () => {
  const response = await adminApi.get("/users");
  return response.data;
};

export const fetchAdminUserDetails = async (userId: number) => {
  const response = await adminApi.get(`/users/${userId}/details`);
  return response.data.user;
};


export const fetchAdminEvents = async () => {
  const response = await adminApi.get("/events");
  return response.data;
};

export const fetchAdminEventRequests = async () => {
  const response = await adminApi.get("/event-requests");
  return response.data;
};

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
  id: number,
  status: "APPROVED" | "REJECTED",
  reason?: string
) => {
  return await axios.patch(
    `${API_BASE_URL}/v1/admin/organiser-requests/${id}`,
    { status, reason },
    { withCredentials: true }
  );
};

export const fetchAdminOrganisers = async () => {
  const response = await adminApi.get("/organisers");
  return response.data;
};

export const fetchAdminCities = async () => {
  const response = await adminApi.get("/cities");
  return response.data;
};

export const addCity = async (
  name: string,
  description: string,
  image?: File | null
) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  if (image) formData.append("image", image);

  const response = await adminApi.post(
    "/add-city",
    formData
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
    image?: File | null;
  }
) => {
  const formData = new FormData();

  if (data.name !== undefined) formData.append("name", data.name);
  if (data.description !== undefined) {
    formData.append("description", data.description);
  }
  if (data.is_active !== undefined) {
    formData.append("is_active", String(data.is_active));
  }
  if (data.image) formData.append("image", data.image);

  const response = await adminApi.patch(
    `/cities/${cityId}`,
    formData
  );

  return response.data;
};

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
