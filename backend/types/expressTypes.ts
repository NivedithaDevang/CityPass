import { AuthPayLoad } from "./auth.js";
export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email?: string;
        [key: string]: any;
      };
    }
  }
}