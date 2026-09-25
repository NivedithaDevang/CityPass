import app from "./app.js";
import { connectDB } from "./config/database.js";
import { SERVER_PORT } from "./config/env.js";

const PORT: number | string = SERVER_PORT;

async function startServer(): Promise<void> {
  try {
    await connectDB();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed. Shutting down server:", error);
    process.exit(1);
  }
}

startServer();