// import joi from "joi";
// import { validateObjectId } from "../../middleware/validation.js";

// export const customizeTrip = joi
//   .object({
//     monthTrip: joi.string().required(),
//     dayTrip: joi.string().required(),
//     tripDuration: joi.string().required(),
//     peopleNumber: joi.number().min(1).required(),
//     berth: joi.string().required(),
//     addressTrip: joi.object({
//       Longitude: joi.number().required(),
//       Latitude: joi.number().required(),
//     }),
//     addressYou: joi.object({
//       Longitude: joi.number().required(),
//       Latitude: joi.number().required(),
//     }),
//     tripTitle: joi.string().min(3).max(50).required(),
//     priceMember: joi.number().default(0).required(),
//     addition: joi.string(),
//     category: joi.string().custom(validateObjectId).required(),
//     subCategory: joi.string().custom(validateObjectId).required(),
//   })
//   .required();
// export const customizeTripId = joi
//   .object({
//     customizeTripId: joi.string().custom(validateObjectId),
//   })
//   .required();
