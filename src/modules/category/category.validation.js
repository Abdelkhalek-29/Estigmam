import joi from "joi";
import { validateObjectId } from "../../middleware/validation.js";

export const createCategory = joi
  .object({
    name: joi.string().min(4).max(15).required(),
    size: joi.number().positive(),
    path: joi.string(),
    filename: joi.string(),
    destination: joi.string(),
    mimetype: joi.string(),
    encoding: joi.string(),
    originalname: joi.string(),
    fieldname: joi.string()
  })
  .required();

export const updateCategory = joi
  .object({
    name: joi.string().min(4).max(15),
    categoryId: joi.string().custom(validateObjectId).required(),
    size: joi.number().positive(),
    path: joi.string(),
    filename: joi.string(),
    destination: joi.string(),
    mimetype: joi.string(),
    encoding: joi.string(),
    originalname: joi.string(),
    fieldname: joi.string()
  })
  .required();

export const deleteCategory = joi
  .object({
    categoryId: joi.string().custom(validateObjectId).required(),
  })
  .required();
