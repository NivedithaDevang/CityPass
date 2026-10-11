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
    type UpdateEvent
} from "../models/eventModel.js";
import cloudinary from "../config/cloudinary.js";
import { getOrganiserByUserId } from "../models/organiserModel.js";
import { Request, Response, NextFunction } from "express";



// Generates a base slug from a string
const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
};

// Ensures the slug is strictly unique in the database
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
            return res.status(400).json({
                message: "A valid event slug is required"
            });
        }

        const results = await getEventBySlug(slug);

        if (results.length === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(200).json({
            message: "Event fetched successfully",
            event: results[0]
        });

    } catch (err) {
        next(err);
    }
};


//for getting all events
export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const results = await getAllEvents();

        res.status(200).json({
            message: "Events fetched successfully",
            events: results
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
            events
        });
    } catch (err) {
        next(err);
    }
};

//for getting only activities where categories are sports, art & adventure
export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activities = await getAllActivities();
        res.status(200).json({
            message : "Activities fetched succesfully",
            activities: activities
        });
    }
    catch(err){
        next(err);
    }
}

//get concerts where category is music
export const getConcerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const concerts = await getAllConcerts();
        res.status(200).json({
            message: "Concerts fetched succesfully",
            concerts: concerts
        });
    }
    catch(err){
        next(err);
    }
}

//for posting new event
export const addEvent = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    let uploadedPublicId : string | null = null;

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
            capacity
        } = req.body;


        // Get logged-in user
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
         
        const imageFile = req.file;

        if(!imageFile) {
            return res.status(400).json ({
                message: "Event image is required"
            })
        }

        // Find organiser using user_id
        const organiser = await getOrganiserByUserId(userId);

        if (!organiser) {
            return res.status(404).json({
                message: "Organiser profile not found"
            });
        }


        // Validate required fields
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
                    "city_id, category_id, name, event_date, time, price and capacity are required"
            });
        }


        // Generate unique slug
        const slug = await generateUniqueSlug(name);

        // Upload image to Cloudinary 
const uploadResult = await new Promise<{ 
    secure_url: string; 
    public_id: string; }>((resolve, reject) => { 
        const uploadStream = cloudinary.uploader.upload_stream( { 
            folder: "citypass/events", 
            resource_type: "image" }, 
            (error, result) => { 
                if (error || !result) 
                    { 
                        return reject( error || new Error( "Cloudinary upload failed" ) 
                    ); 
                } 
                resolve({
                     secure_url: result.secure_url, 
                     public_id: result.public_id }); 
                    } 
                ); 
                uploadStream.end(imageFile.buffer); 
            }); 
            
            uploadedPublicId = uploadResult.public_id;

        // Create event
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

            // Organizer cannot approve their own event
            status: "PENDING"
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
                description:
                    description?.trim() || null,
                location:
                    location?.trim() || null,
                event_date,
                time,
                price: Number(price),
                capacity: Number(capacity),
                status: "PENDING"
            }
        });

    } catch (err) {

        if(uploadedPublicId){
            try{
                await cloudinary.uploader.destroy(
                    uploadedPublicId,
                    {
                        resource_type: "image"
                    }
                );
            } catch{
                res.status(500).json({
                    message : "Unable to create event"
                })
            }
        }


        next(err);
    }
};


//for updating event details
export const updateEvent = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let uploadedPublicId: string | null = null;

    try {
        const eventId = Number(req.params.id);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                message: "A valid event id is required"
            });
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
            status
        } = req.body;

        const imageFile = req.file;
        const existingEvent = await getEventById(eventId);

if (existingEvent.length === 0) {
    return res.status(404).json({
        message: "Event not found"
    });
}
        let slug: string | undefined;

        if (name !== undefined) {
            slug = await generateUniqueSlug(
                name.trim(),
                eventId
            );
        }

        let newImageUrl: string | undefined;
        let newPublicId: string | undefined;

        if (imageFile) {
            const uploadResult = await new Promise<{
                secure_url: string;
                public_id: string;
            }>((resolve, reject) => {
                const uploadStream =
                    cloudinary.uploader.upload_stream(
                        {
                            folder: "citypass/events",
                            resource_type: "image"
                        },
                        (error, result) => {
                            if (error || !result) {
                                return reject(
                                    error ||
                                        new Error(
                                            "Cloudinary upload failed"
                                        )
                                );
                            }

                            resolve({
                                secure_url: result.secure_url,
                                public_id: result.public_id
                            });
                        }
                    );

                uploadStream.end(imageFile.buffer);
            });

            newImageUrl = uploadResult.secure_url;
            newPublicId = uploadResult.public_id;

            uploadedPublicId = newPublicId;
        }
const updatePayload: UpdateEvent = {};

        if (name !== undefined) {
            updatePayload.name = name.trim();
        }

        if (slug !== undefined) {
            updatePayload.slug = slug;
        }

        if (description !== undefined) {
            updatePayload.description =
                description?.trim() || null;
        }

        if (location !== undefined) {
            updatePayload.location =
                location?.trim() || null;
        }

        if (city_id !== undefined) {
            updatePayload.city_id = Number(city_id);
        }

        if (category_id !== undefined) {
            updatePayload.category_id = Number(category_id);
        }

        if (event_date !== undefined) {
            updatePayload.event_date = event_date;
        }

        if (time !== undefined) {
            updatePayload.time = time;
        }

        if (price !== undefined) {
            updatePayload.price = Number(price);
        }

        if (capacity !== undefined) {
            updatePayload.capacity = Number(capacity);
        }

        if (status !== undefined) {
            updatePayload.status = status;
        }
        if (newImageUrl) {
            updatePayload.image = newImageUrl;
        }
        await updateEventModel(
            eventId,
            updatePayload
        );
        if (imageFile && existingEvent.length > 0) {
            const oldImageUrl = existingEvent[0].image;

            if (oldImageUrl) {
                try {
                    const uploadIndex =
                        oldImageUrl.indexOf("/upload/");

                    if (uploadIndex !== -1) {
                        let publicId = oldImageUrl.substring(
                            uploadIndex + 8
                        );

                        // Remove version number
                        publicId = publicId.replace(
                            /^v\d+\//,
                            ""
                        );

                        // Remove extension
                        publicId = publicId.replace(
                            /\.[^/.]+$/,
                            ""
                        );

                        await cloudinary.uploader.destroy(
                            publicId,
                            {
                                resource_type: "image"
                            }
                        );
                    }
                } catch {
                    
                }
            }
        }
        return res.status(200).json({
            message: "Event updated successfully",
            eventId,
            slug,
            image: newImageUrl || undefined
        });

    } catch (err) {

        if (uploadedPublicId) {
            try {
                await cloudinary.uploader.destroy(
                    uploadedPublicId,
                    {
                        resource_type: "image"
                    }
                );
            } catch {

            }
        }

        next(err);
    }
};


// Admin: Approve or reject an event
export const updateEventStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const eventId = Number(req.params.id);
        const { status } = req.body;

        // Validate event ID
        if (!Number.isInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                message: "A valid event id is required"
            });
        }

        // Only APPROVED or REJECTED is allowed
        if (
            status !== "APPROVED" &&
            status !== "REJECTED"
        ) {
            return res.status(400).json({
                message: "Status must be APPROVED or REJECTED"
            });
        }

        // Update only the event status
        const result = await updateEventStatusModel(
            eventId,
            status
        );

        // Event does not exist
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.status(200).json({
            message:
                status === "APPROVED"
                    ? "Event approved successfully"
                    : "Event rejected successfully",
            eventId,
            status
        });

    } catch (err) {
        next(err);
    }
};

