import joi from "joi";
import { Types } from "mongoose";

export const validateObjectId = (value, helper) => {
  console.log({ value });
  console.log(helper);
  return Types.ObjectId.isValid(value)
    ? true
    : helper.message("In-valid objectId");
};
export const generalFields = {
  email: joi
    .string()
    .email({
      minDomainSegments: 2,
      maxDomainSegments: 4,
      tlds: { allow: ["com", "net"] },
    })
    .required(),
  password: joi.string(),
  cPassword: joi.string().required(),
  id: joi.string().custom(validateObjectId).required(),
  name: joi.string().required(),
  file: joi.object({
    size: joi.number().positive().required().messages({
      "number.base": "File size must be a positive number.",
      "any.required": "File size is required.",
    }),
    path: joi.string().required().messages({
      "string.base": "File path must be a string.",
      "any.required": "File path is required.",
    }),
    filename: joi.string().required().messages({
      "string.base": "File name must be a string.",
      "any.required": "File name is required.",
    }),
    destination: joi.string().required().messages({
      "string.base": "File destination must be a string.",
      "any.required": "File destination is required.",
    }),
    mimetype: joi.string().required().messages({
      "string.base": "File MIME type must be a string.",
      "any.required": "File MIME type is required.",
    }),
    encoding: joi.string().required().messages({
      "string.base": "File encoding must be a string.",
      "any.required": "File encoding is required.",
    }),
    originalname: joi.string().required().messages({
      "string.base": "Original file name must be a string.",
      "any.required": "Original file name is required.",
    }),
    fieldname: joi.string().required().messages({
      "string.base": "Field name must be a string.",
      "any.required": "Field name is required.",
    }),
  }),
};

export const validation = (Schema) => {
  return (req, res, next) => {
    const copyReq = {
      ...req.body,
      ...req.params,
      ...req.query,
      ...req.files,
      ...req.file, // For single files
    };
    const validationResult = Schema.validate(copyReq, { abortEarly: false });
    if (validationResult.error) {
      const errorMessages = validationResult.error.details.map(
        (error) => error.message
      );
      return next(new Error(errorMessages), { cause: 400 });
    }
    return next();
  };
};
