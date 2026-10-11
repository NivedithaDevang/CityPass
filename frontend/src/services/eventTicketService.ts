import axios from "axios";
import { API_BASE_URL } from "../config/config";

export interface EventTicket {
  id: number;
  event_id: number;
  ticket_id?: number | null;
  name: string;
  description?: string | null;
  price: number;
  status?: string;
}

export interface TicketTemplate {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  category?: string;
}

const publicTicketUrl = `${API_BASE_URL}/v1/events`;
const organiserTicketUrl = `${API_BASE_URL}/v1/organisers/events`;


export const getEventTickets = async (
  eventId: number,
): Promise<EventTicket[]> => {
  const response = await axios.get(
    `${publicTicketUrl}/${eventId}/tickets`,
    { withCredentials: true },
  );

  const data = response.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tickets)) return data.tickets;
  if (Array.isArray(data?.data?.tickets)) return data.data.tickets;

  return [];
};

export const getTicketTemplates = async (
  eventId: number,
): Promise<TicketTemplate[]> => {
  const response = await axios.get(
    `${publicTicketUrl}/${eventId}/ticket-templates`,
    { withCredentials: true },
  );

  const data = response.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tickets)) return data.tickets;
  if (Array.isArray(data?.data?.tickets)) return data.data.tickets;

  return [];
};


export const assignTicketTemplate = async (
  eventId: number,
  templateId: number,
) => {
  return axios.post(
    `${organiserTicketUrl}/${eventId}/tickets/template`,
    { ticket_id: templateId },
    { withCredentials: true },
  );
};

export const createCustomEventTicket = async (
  eventId: number,
  ticket: {
    name: string;
    description: string;
    price: number;
  },
) => {
  return axios.post(
    `${organiserTicketUrl}/${eventId}/tickets/custom`,
    ticket,
    { withCredentials: true },
  );
};