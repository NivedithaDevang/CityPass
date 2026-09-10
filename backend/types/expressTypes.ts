import { AuthPayLoad } from "./auth.js";
export {};

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayLoad;
    }
  }
}