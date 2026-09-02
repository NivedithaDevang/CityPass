import express from "express";
import cors from "cors";
import db from "./config/database.js";
import userRouter from "./routes/v1/userRoutes.js"; 
import cityRouter from "./routes/v1/cityRoute.js";
import categoryRouter from "./routes/v1/categoryRoute.js";
import orgReqRouter from "./routes/v1/orgRequestRoute.js";
import organizerRouter from "./routes/v1/organiserRoute.js";
import eventRouter from "./routes/v1/eventRoute.js";
import bookRouter from "./routes/v1/bookingRoute.js";
import ticketRouter from "./routes/v1/ticketRoute.js";
import errorHandler from "./middleware/errorHandler.js";

import authRoutes from "./routes/v1/authRoute.js";
import { error } from "node:console";
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "CityPass API is running"
    });
});

app.use("/v1/users", userRouter);
app.use("/v1/cities", cityRouter);
app.use("/v1/categories", categoryRouter);
app.use("/v1/orgreq", orgReqRouter);
app.use("/v1/organizers", organizerRouter);
app.use("/v1/events", eventRouter);
app.use("/v1/bookings", bookRouter);
app.use("/v1/tickets", ticketRouter);
app.use("/v1/auth", authRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
