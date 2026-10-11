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
  type UpdateEvent,
} from "../models/eventModel.js";
import cloudinary from "../config/cloudinary.js";
import { getOrganiserByUserId } from "../models/organiserModel.js";
import { Request, Response, NextFunction } from "express";

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

export const getEventDetailsBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    if (typeof slug !== "string") {
      return res.status(400).json({ message: "A valid event slug is required" });
    }

    const results = await getEventBySlug(slug);

    if (results.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({
      message: "Event fetched successfully",
      event: results[0],
    });
  } catch (err) {
    next(err);
  }
};

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await getAllEvents();
    res.status(200).json({
      message: "Events fetched successfully",
      events: results,
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminEventRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const events = await getAdminEventRequestsModel();
    res.status(200).json({
      message: "Event requests fetched successfully",
      events,
    });
  } catch (err) {
    next(err);
  }
};

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activities = await getAllActivities();
    res.status(200).json({
      message: "Activities fetched successfully",
      activities,
    });
  } catch (err) {
    next(err);
  }
};

export const getConcerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const concerts = await getAllConcerts();
    res.status(200).json({
      message: "Concerts fetched successfully",
      concerts,
    });
  } catch (err) {
    next(err);
  }
};

// Create Event
export const addEvent = async (req: Request, res: Response, next: NextFunction) => {
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
      age_restriction,
      duration,
      duration_hours,
      instructions,
      additional_instructions,
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const imageFile = req.file;
    if (!imageFile) {
      return res.status(400).json({ message: "Event image is required" });
    }

    const organiser = await getOrganiserByUserId(userId);
    if (!organiser) {
      return res.status(404).json({ message: "Organiser profile not found" });
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
      return res.status(400).json({
        message:
          "city_id, category_id, name, event_date, time, price and capacity are required",
      });
    }

    const slug = await generateUniqueSlug(name);

    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "citypass/events",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error("Cloudinary upload failed"));
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

    const parsedDuration = parseDurationHours(duration_hours ?? duration);
    const resolvedInstructions = (additional_instructions ?? instructions)?.trim() || null;
    const resolvedAgeGroup = (age_group ?? age_restriction)?.trim() || null;

    const result = await createEvent({
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
    });

    res.status(201).json({
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
  } catch (err) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: "image" });
      } catch {
        res.status(500).json({ message: "Unable to create event" });
      }
    }
    next(err);
  }
};

// Update Event
export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedPublicId: string | null = null;

  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ message: "A valid event id is required" });
    }

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
      age_restriction,
      duration,
      duration_hours,
      instructions,
      additional_instructions,
    } = req.body;

    const imageFile = req.file;
    const existingEvent = await getEventById(eventId);

    if (existingEvent.length === 0) {
      return res.status(404).json({ message: "Event not found" });
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
                return reject(error || new Error("Cloudinary upload failed"));
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
    if (city_id !== undefined) updatePayload.city_id = Number(city_id);
    if (category_id !== undefined) updatePayload.category_id = Number(category_id);
    if (event_date !== undefined) updatePayload.event_date = event_date;
    if (time !== undefined) updatePayload.time = time;
    if (price !== undefined) updatePayload.price = Number(price);
    if (capacity !== undefined) updatePayload.capacity = Number(capacity);
    if (status !== undefined) updatePayload.status = status;
    if (newImageUrl) updatePayload.image = newImageUrl;

    if (languages !== undefined) {
      updatePayload.languages = languages;
    }
    if (age_group !== undefined || age_restriction !== undefined) {
      updatePayload.age_group = (age_group ?? age_restriction)?.trim() || null;
    }
    if (duration_hours !== undefined || duration !== undefined) {
      updatePayload.duration_hours = parseDurationHours(duration_hours ?? duration);
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
      message: "Event updated successfully",
      eventId,
      slug,
      image: newImageUrl || undefined,
    });
  } catch (err) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: "image" });
      } catch {
        // ignore
      }
    }
    next(err);
  }
};

export const updateEventStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ message: "A valid event id is required" });
    }

    if (status !== "APPROVED" && status !== "REJECTED") {
      return res.status(400).json({ message: "Status must be APPROVED or REJECTED" });
    }

    const result = await updateEventStatusModel(eventId, status);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({
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