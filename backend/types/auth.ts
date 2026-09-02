export type AuthPayLoad = {
    id : number;
    name : string;
    email : string;
    role : "USER" | "ORGANIZER" | "ADMIN";
}