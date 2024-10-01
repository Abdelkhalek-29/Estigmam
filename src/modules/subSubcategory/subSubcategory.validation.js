// import joi from "joi";
// import { validateObjectId } from "../../middleware/validation.js";
// export const createSubSubCategory = joi
//   .object({
//     name: joi.string().min(5).max(20).required(),
//     categoryId: joi.string().custom(validateObjectId).required(),
//     subCategoryId: joi.string().custom(validateObjectId).required(),
//   })
//   .required();

// export const updateSubSubCategory = joi
//   .object({
//     name: joi.string().min(5).max(20),
//     categoryId: joi.string().custom(validateObjectId).required(),
//     subcategoryId: joi.string().custom(validateObjectId).required(),
//     subSubcategoryId: joi.string().custom(validateObjectId).required(),
//   })
//   .required();

// export const deleteSubSubCategory = joi
//   .object({
//     categoryId: joi.string().custom(validateObjectId).required(),
//     subcategoryId: joi.string().custom(validateObjectId).required(),
//     subSubcategoryId: joi.string().custom(validateObjectId).required(),


//   })
//   .required();
