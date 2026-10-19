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

export const updateEventTicket = async (
  eventId: number,
  ticketId: number,
  ticket: {
    name: string;
    description: string;
    price: number;
  },
) => {
  return axios.patch(
    `${organiserTicketUrl}/${eventId}/tickets/${ticketId}`,
    ticket,
    { withCredentials: true },
  );
};

export const deleteEventTicket = async (
  eventId: number,
  ticketId: number,
) => {
  return axios.delete(
    `${organiserTicketUrl}/${eventId}/tickets/${ticketId}`,
    { withCredentials: true },
  );
};