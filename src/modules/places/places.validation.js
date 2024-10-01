// import joi from "joi";
// import { validateObjectId } from "../../middleware/validation.js";
// validateObjectId;
// export const createSubCategory = joi
//   .object({
//     name: joi.string().min(5).max(20).required(),
//     categoryId: joi.string().custom(validateObjectId).required(),
//     size: joi.number().positive().required(),
//     path: joi.string().required(),
//     filename: joi.string().required(),
//     destination: joi.string().required(),
//     mimetype: joi.string().required(),
//     encoding: joi.string().required(),
//     originalname: joi.string().required(),
//     fieldname: joi.string().required(),
//   })
//   .required();

// export const updateSubCategory = joi
//   .object({
//     name: joi.string().min(5).max(20),
//     categoryId: joi.string().custom(validateObjectId).required(),
//     subcategory: joi.string().custom(validateObjectId).required(),
//     size: joi.number().positive(),
//     path: joi.string(),
//     filename: joi.string(),
//     destination: joi.string(),
//     mimetype: joi.string(),
//     encoding: joi.string(),
//     originalname: joi.string(),
//     fieldname: joi.string(),
//   })
//   .required();

// export const deleteSubCategory = joi
//   .object({
//     categoryId: joi.string().custom(validateObjectId).required(),
//     subcategory: joi.string().custom(validateObjectId).required(),
//   })
//   .required();
