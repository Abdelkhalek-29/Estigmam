import joi from "joi";
import { validateObjectId } from "../../middleware/validation.js";


export const tripId = joi
  .object({
    tripId: joi.string().custom(validateObjectId),
  })  .required();
