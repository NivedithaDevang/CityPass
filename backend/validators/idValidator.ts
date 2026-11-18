
import AppError from "../types/appError.js";

export const validateId = (value: unknown): number => {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new AppError("ID must be a positive integer.", 400);
  }

  if (typeof value === "string" && !/^\d+$/.test(value)) {
    throw new AppError("ID must be a positive integer.", 400);
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AppError("ID must be a valid positive integer.", 400);
  }

  return id;
};
