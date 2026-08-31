import { AuthPayLoad } from "./auth.js";


declare global {
    namespace Express {
        interface Request {
            user?: AuthPayLoad;
        }
    }
}