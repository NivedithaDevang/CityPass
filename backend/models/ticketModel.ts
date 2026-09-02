import { dbConfig } from "../config/database.js";   
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";


//creating a type
type Ticket = {
    id?: number;
    event_id : number;
    name: string;
    description: string;
    price: number;
    status: string
};

type TicketRow = RowDataPacket & Ticket;


//getting all tickets
export const getAllTickets = async () => {
    const [results] = await dbConfig.query<TicketRow[]>("SELECT * FROM tickets");
    return results;
};

//posting a new ticket
export const createTicket = async (ticket: Ticket) => {
    const sql = `
        INSERT INTO tickets (event_id, name, description, price, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    const [results] = await dbConfig.query<ResultSetHeader>(
        sql,
        [ticket.event_id, ticket.name, ticket.description, ticket.price, ticket.status]
    );
    return results;
};


