import joi from "joi";
import { validateObjectId } from "../../middleware/validation.js";

const locationSchema = joi.object({
  Longitude: joi.number().required().min(-180).max(180),
  Latitude: joi.number().required().min(-90).max(90),
});
export const addCity = joi
  .object({
    name: joi.string().min(3).max(20).required(),
    countryId: joi.string().custom(validateObjectId).required(),
    location: locationSchema.required(),
  })
  .required();
export const addCountry = joi
  .object({
    name: joi.string().min(3).max(20).required(),
    codePhone: joi.number().integer().required(),
    size: joi.number().positive().required(),
    path: joi.string().required(),
    filename: joi.string().required(),
    destination: joi.string().required(),
    mimetype: joi.string().required(),
    encoding: joi.string().required(),
    originalname: joi.string().required(),
    fieldname: joi.string().required(),
  })
  .required();

