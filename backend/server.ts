import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { REACT_PORT, REACTURL } from "./config/env.js";
import authRoutes from "./routes/v1/authRoute.js";
import bookRouter from "./routes/v1/bookingRoute.js";
import categoryRouter from "./routes/v1/categoryRoute.js";
import cityRouter from "./routes/v1/cityRoute.js";
import eventRouter from "./routes/v1/eventRoute.js";
import organiserRouter from "./routes/v1/organiserRoute.js";
import orgRequestRouter from "./routes/v1/orgRequestRoute.js";
import ticketRouter from "./routes/v1/ticketRoute.js";
import userRouter from "./routes/v1/userRoutes.js"; 
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

app.use(cors({
    origin: (origin, callback) => {
        // Block if it doesn't match REACTURL (localhost:5174)
        if (!origin || origin === REACTURL) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({
        message: "CityPass API is running"
    });
});

app.use("/v1/auth", authRoutes);
app.use("/v1/bookings", bookRouter);
app.use("/v1/categories", categoryRouter);
app.use("/v1/cities", cityRouter);
app.use("/v1/events", eventRouter);
app.use("/v1/organisers", organiserRouter);
app.use("/v1/orgrequest", orgRequestRouter);
app.use("/v1/tickets", ticketRouter);
app.use("/v1/users", userRouter);
app.use(errorHandler);

const PORT = REACT_PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
