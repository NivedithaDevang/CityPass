import express from "express";
import db from "./config/database.js";
import userRoutes from "./routes/userRoutes.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "CityPass API is running"
    });
});

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
