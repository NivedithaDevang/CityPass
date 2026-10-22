import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary.js";
import AppError from "../types/appError.js";
import { getOrganiserByUserId } from "../models/organiserModel.js";
import {
  getEventById,
  getAllEvents,
  getAllActivities,
  getAllConcerts,
  getEventBySlug,
  getAdminEventRequests as getAdminEventRequestsModel,
  createEvent,
  updateEvent as updateEventModel,
  updateEventStatus as updateEventStatusModel,
  checkSlugExists,
  cancelEvent,
  goLive,
  type UpdateEvent,
} from "../models/eventModel.js";
import { validateId } from "../validators/idValidator.js";

// Helper to parse duration string like "2 Hours" or numeric string "2.5" into decimal hours
const parseDurationHours = (val: any): number | null => {
  if (val === undefined || val === null || val === "") return null;
  if (typeof val === "number") return val;
  const match = String(val).match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
};

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const generateUniqueSlug = async (name: string, excludeId?: number): Promise<string> => {
  const baseSlug = slugify(name);
  let candidateSlug = baseSlug;
  let counter = 1;

  while (await checkSlugExists(candidateSlug, excludeId)) {
    candidateSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return candidateSlug;
};

// GET /events/:slug
export const getEventDetailsBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    if (!slug || typeof slug !== "string") {
      throw new AppError("A valid event slug is required", 400);
    }

    const results = await getEventBySlug(slug);

    if (results.length === 0) {
      throw new AppError("Event not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Event fetched successfully",
      event: results[0],
    });
  } catch (err) {
    next(err);
  }
};

// GET /events
export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const results = await getAllEvents();
    return res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      events: results,
    });
  } catch (err) {
    next(err);
  }
};

// GET /admin/event-requests
export const getAdminEventRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const events = await getAdminEventRequestsModel();
    return res.status(200).json({
      success: true,
      message: "Event requests fetched successfully",
      events,
    });
  } catch (err) {
    next(err);
  }
};

// GET /events/activities
export const getActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const activities = await getAllActivities();
    return res.status(200).json({
      success: true,
      message: "Activities fetched successfully",
      activities,
    });
  } catch (err) {
    next(err);
  }
};

// GET /events/concerts
export const getConcerts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const concerts = await getAllConcerts();
    return res.status(200).json({
      success: true,
      message: "Concerts fetched successfully",
      concerts,
    });
  } catch (err) {
    next(err);
  }
};

// POST /events
export const addEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let uploadedPublicId: string | null = null;

  try {
    const {
      city_id,
      category_id,
      name,
      description,
      location,
      event_date,
      time,
      price,
      capacity,
      languages,
      age_group,
      duration_hours,
      instructions,
      additional_instructions,
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized: Authentication required", 401);
    }

    const imageFile = req.file;
    if (!imageFile) {
      throw new AppError("Event image is required", 400);
    }

    const organiser = await getOrganiserByUserId(userId);
    if (!organiser) {
      throw new AppError("Organiser profile not found", 404);
    }

    if (
      city_id === undefined ||
      category_id === undefined ||
      !name ||
      !event_date ||
      !time ||
      price === undefined ||
      capacity === undefined
    ) {
      throw new AppError(
        "city_id, category_id, name, event_date, time, price and capacity are required",
        400
      );
    }

    const slug = await generateUniqueSlug(name);
    const cityId = validateId(city_id);
const categoryId = validateId(category_id);

    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "citypass/events",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) {
              return reject(new AppError("Cloudinary upload failed", 502));
            }
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          }
        );
        uploadStream.end(imageFile.buffer);
      }
    );

    uploadedPublicId = uploadResult.public_id;

    const parsedDuration = parseDurationHours(duration_hours);
    const resolvedInstructions = (additional_instructions ?? instructions)?.trim() || null;
    const resolvedAgeGroup = (age_group)?.trim() || null;

    const result = await createEvent({
      organizer_id: organiser.id,
      city_id: cityId,
      category_id: categoryId,
      name: name.trim(),
      image: uploadResult.secure_url,
      slug,
      description: description?.trim() || null,
      location: location?.trim() || null,
      event_date,
      time,
      price: Number(price),
      capacity: Number(capacity),
      status: "PENDING",
      languages: languages ?? null,
      age_group: resolvedAgeGroup,
      duration_hours: parsedDuration,
      additional_instructions: resolvedInstructions,
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: {
        id: result.insertId,
        organizer_id: organiser.id,
        city_id: Number(city_id),
        category_id: Number(category_id),
        name: name.trim(),
        image: uploadResult.secure_url,
        slug,
        description: description?.trim() || null,
        location: location?.trim() || null,
        event_date,
        time,
        price: Number(price),
        capacity: Number(capacity),
        status: "PENDING",
        languages: languages ?? null,
        age_group: resolvedAgeGroup,
        duration_hours: parsedDuration,
        additional_instructions: resolvedInstructions,
      },
    });
  } catch (err: any) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: "image" });
      } catch (cleanupErr) {
        console.error("Cloudinary cleanup failed:", cleanupErr);
      }
    }

    if (err.code === "ER_DUP_ENTRY") {
      return next(new AppError("An event with this slug or name already exists", 409));
    }

    next(err);
  }
};

// PUT /events/:id
export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let uploadedPublicId: string | null = null;

  try {
    const eventId = validateId(req.params.id);

    const {
      name,
      description,
      city_id,
      category_id,
      location,
      event_date,
      time,
      price,
      capacity,
      status,
      languages,
      age_group,
      duration_hours,
      instructions,
      additional_instructions,
    } = req.body;

    const imageFile = req.file;
    const existingEvent = await getEventById(eventId);

    if (existingEvent.length === 0) {
      throw new AppError("Event not found", 404);
    }

    let slug: string | undefined;
    if (name !== undefined) {
      slug = await generateUniqueSlug(name.trim(), eventId);
    }

    let newImageUrl: string | undefined;
    let newPublicId: string | undefined;

    if (imageFile) {
      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "citypass/events",
              resource_type: "image",
            },
            (error, result) => {
              if (error || !result) {
                return reject(new AppError("Cloudinary upload failed", 502));
              }
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
              });
            }
          );
          uploadStream.end(imageFile.buffer);
        }
      );

      newImageUrl = uploadResult.secure_url;
      newPublicId = uploadResult.public_id;
      uploadedPublicId = newPublicId;
    }

    const updatePayload: UpdateEvent = {};

    if (name !== undefined) updatePayload.name = name.trim();
    if (slug !== undefined) updatePayload.slug = slug;
    if (description !== undefined) updatePayload.description = description?.trim() || null;
    if (location !== undefined) updatePayload.location = location?.trim() || null;
    if (city_id !== undefined) updatePayload.city_id = validateId(city_id);
    if (category_id !== undefined) updatePayload.category_id = validateId(category_id);
    if (event_date !== undefined) updatePayload.event_date = event_date;
    if (time !== undefined) updatePayload.time = time;
    if (price !== undefined) updatePayload.price = Number(price);
    if (capacity !== undefined) updatePayload.capacity = Number(capacity);
    if (status !== undefined) updatePayload.status = status;
    if (newImageUrl) updatePayload.image = newImageUrl;

    if (languages !== undefined) {
      updatePayload.languages = languages;
    }
    if (age_group !== undefined) {
      updatePayload.age_group = (age_group)?.trim() || null;
    }
    if (duration_hours !== undefined) {
      updatePayload.duration_hours = parseDurationHours(duration_hours);
    }
    if (additional_instructions !== undefined || instructions !== undefined) {
      updatePayload.additional_instructions =
        (additional_instructions ?? instructions)?.trim() || null;
    }

    await updateEventModel(eventId, updatePayload);

    if (imageFile && existingEvent.length > 0) {
      const oldImageUrl = existingEvent[0].image;
      if (oldImageUrl) {
        try {
          const uploadIndex = oldImageUrl.indexOf("/upload/");
          if (uploadIndex !== -1) {
            let publicId = oldImageUrl.substring(uploadIndex + 8);
            publicId = publicId.replace(/^v\d+\//, "");
            publicId = publicId.replace(/\.[^/.]+$/, "");
            await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
          }
        } catch {
          // ignore cleanup errors
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      eventId,
      slug,
      image: newImageUrl || undefined,
    });
  } catch (err: any) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: "image" });
      } catch {
        // ignore cleanup errors
      }
    }

    if (err.code === "ER_DUP_ENTRY") {
      return next(new AppError("An event with this slug or name already exists", 409));
    }

    next(err);
  }
};

// PATCH /events/:id/status
export const updateEventStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = validateId(req.params.id);
    const { status } = req.body;

    if (status !== "APPROVED" && status !== "REJECTED") {
      throw new AppError("Status must be APPROVED or REJECTED", 400);
    }

    const result = await updateEventStatusModel(eventId, status);

    if (result.affectedRows === 0) {
      throw new AppError("Event not found", 404);
    }

    return res.status(200).json({
      success: true,
      message:
        status === "APPROVED"
          ? "Event approved successfully"
          : "Event rejected successfully",
      eventId,
      status,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /events/:id/cancel
export const cancelOrganiserEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = validateId(req.params.id);
const { status } = req.body;
const authenticatedUserId = req.user?.id;

if (!authenticatedUserId) {
  throw new AppError("Unauthorized: Authentication required", 401);
}

const userId = validateId(authenticatedUserId);

    if (status !== "CANCELLED") {
      throw new AppError("Status must be CANCELLED", 400);
    }

    const organiser = await getOrganiserByUserId(userId);
    if (!organiser) {
      throw new AppError("Organiser profile not found", 404);
    }

    const [event] = await getEventById(eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    if (event.organizer_id !== organiser.id) {
      throw new AppError("Forbidden: You cannot cancel this event", 403);
    }

    const result = await cancelEvent(eventId, status);
    if (result.affectedRows === 0) {
      throw new AppError("Event not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Event cancelled successfully",
      eventId,
      status,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /events/:id/go-live
export const goEventLive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = validateId(req.params.id);
    const { isLive } = req.body;
    const authenticatedUserId = req.user?.id;

    if (!authenticatedUserId) {
      throw new AppError("Unauthorized: Authentication required", 401);
    }

    const userId = validateId(authenticatedUserId);

    if (typeof isLive !== "boolean") {
      throw new AppError("isLive must be a boolean", 400);
    }

    const organiser = await getOrganiserByUserId(userId);
    if (!organiser) {
      throw new AppError("Organiser profile not found", 404);
    }

    const [event] = await getEventById(eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    if (event.organizer_id !== organiser.id) {
      throw new AppError("Forbidden: You cannot update this event", 403);
    }

    // Only allow going live if today's date matches the event date
    if (isLive) {
      const getLocalDateString = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const todayStr = getLocalDateString(new Date());

      // Extract YYYY-MM-DD from event.event_date
      let eventDateStr = "";
      if (typeof event.event_date === "string") {
        eventDateStr = event.event_date.split("T")[0].split(" ")[0];
      } else if (event.event_date instanceof Date) {
        eventDateStr = getLocalDateString(event.event_date);
      }

      if (todayStr !== eventDateStr) {
        throw new AppError(
          "An event can only go live on the day of the event.",
          400
        );
      }
    }

    await goLive(eventId, isLive);

    return res.status(200).json({
      success: true,
      message: isLive ? "Event is now live" : "Event is no longer live",
      eventId,
      isLive,
    });
  } catch (err) {
    next(err);
  }
};