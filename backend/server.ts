import express from "express";
import db from "./config/database.js";
import userRouter from "./routes/userRoutes.js"; 
import cityRouter from "./routes/cityRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import orgReqRouter from "./routes/orgRequestRoute.js";
import organizerRouter from "./routes/organiserRoute.js";
<<<<<<< HEAD
import eventRouter from "./routes/eventRoute.js";
import bookRouter from "./routes/bookingRoute.js";
import passRouter from "./routes/passRoute.js";
=======
import authRoutes from "./routes/authRoute.js";
>>>>>>> validator
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "CityPass API is running"
    });
});

app.use("/users", userRouter);
app.use("/cities", cityRouter);
app.use("/categories", categoryRouter);
app.use("/orgreq", orgReqRouter);
app.use("/organizers", organizerRouter);
<<<<<<< HEAD
app.use("/events", eventRouter);
app.use("/bookings", bookRouter);
app.use("/passes", passRouter);

=======
app.use("/auth", authRoutes);
>>>>>>> validator

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
