import joi from "joi";

export const createBanner = joi.object({
  name: joi.string().required().min(4).max(15),
  description: joi.string().required(),
  categoryId: joi.string().required(),
  size: joi.number().positive(),
  path: joi.string(),
  filename: joi.string(),
  destination: joi.string(),
  mimetype: joi.string(),
  encoding: joi.string(),
  originalname: joi.string(),
  fieldname: joi.string(),
});
