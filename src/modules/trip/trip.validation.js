import joi from "joi";
import { validateObjectId } from "../../middleware/validation.js";

const locationSchema = joi.object({
  Longitude: joi.number().required().min(-180).max(180),
  Latitude: joi.number().required().min(-90).max(90),
});

export const createTrip = joi
  .object({
    startDate: joi.date().greater(Date.now()).required(),
    endDate: joi.date().greater(joi.ref("startDate")).required(),
    description: joi.string().allow(""),
    peopleNumber: joi.number().min(1).integer().positive().required(),
    startLocation: locationSchema.required(),
    endLocation: locationSchema.required(),
    descriptionAddress: joi.string().required(),
    tripTitle: joi.string().trim().min(3).max(50).required(),
    priceMember: joi.number().min(0).required(),
    offer: joi.number().min(0).max(100),
    category: joi.string().custom(validateObjectId).required(),
    addition: joi.array().items(joi.string()).required(),
    typeOfPlace: joi.string().custom(validateObjectId).required(),
    activity: joi.string().custom(validateObjectId),
    berh: joi.string(),
    bedType: joi.string().custom(validateObjectId),
    cityId: joi.string().custom(validateObjectId).required(),
    numberOfPeopleAvailable: joi.number().min(0),
    equipmentId: joi.string().custom(validateObjectId),
    tripLeaderId: joi.string().custom(validateObjectId),
    /* defaultImage: joi
      .array()
      .items(
        joi.object({
          size: joi.number().positive().required(),
          path: joi.string().required(),
          filename: joi.string().required(),
          destination: joi.string().required(),
          mimetype: joi.string().required(),
          encoding: joi.string().required(),
          originalname: joi.string().required(),
          fieldname: joi.string().required(),
        })
      )
      .length(1)
      .required(),
    subImages: joi
      .array()
      .items(
        joi.object({
          size: joi.number().positive().required(),
          path: joi.string().required(),
          filename: joi.string().required(),
          destination: joi.string().required(),
          mimetype: joi.string().required(),
          encoding: joi.string().required(),
          originalname: joi.string().required(),
          fieldname: joi.string().required(),
        })
      )
      .max(3),*/
  })
  .required();
export const tripId = joi
  .object({
    tripId: joi.string().custom(validateObjectId),
  })
  .required();
export const bookeTicket = joi.object({
  tripId: joi.string().custom(validateObjectId),
  BookedTicket: joi.number().min(1).required(),
  paymentType: joi
    .string()
    .valid("Wallet", "Card", "Paypal", "Apple", "Google"),
});
export const categoryId = joi.object({
  categoryId: joi.string().custom(validateObjectId),
});

export const rating = joi.object({
  tripId: joi.string().custom(validateObjectId),
  rating: joi.number().min(1).max(5).required(),
  comment: joi.string().required().min(5).max(500),
});

export const scheduleUserTrips = {
  type: joi
    .string()
    .valid(
      "current",
      "upcoming",
      "pending",
      "cancelled",
      "rejected",
      "completed"
    )
    .optional(),
};
