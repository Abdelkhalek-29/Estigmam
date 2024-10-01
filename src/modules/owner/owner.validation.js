import joi from "joi";
import {
  generalFields,
  validateObjectId,
} from "../../middleware/validation.js";

export const registerSchema = joi
  .object({
    fullName: joi.string().min(3).max(20).required(),
    /*  userName: joi
      .string()
      .regex(/^[a-zA-Z0-9._]+$/)
      .trim()
      .min(5)
      .max(15)
      .required(),*/
    email: joi.string().email().required(),

    nationalID: joi.string().min(14).required(),
    city: joi.string().custom(validateObjectId).required(),
    country: joi.string().custom(validateObjectId).required(),
    password: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .required(),
    confirmPassword: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .valid(joi.ref("password"))
      .required(),
    phone: joi
      .string()
      .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .required(),
    phoneWithCode: joi
      .string()
      .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/),
    MarineActivity: joi.string(),
    LandActivity: joi.string(),
  })
  .required();

export const login = joi
  .object({
    phone: joi
      .string()
      .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .required(),
    password: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .required(),
  })
  .required();

export const verify = joi
  .object({
    forgetCode: joi.string().required(),
  })
  .required();
export const sendForgetCode = joi
  .object({
    phone: joi
      .string()
      .regex(/^[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .required(),
  })
  .required();

export const resetPassword = joi
  .object({
    password: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .required(),
    confirmPassword: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .valid(joi.ref("password"))
      .required(),
    OldPassword: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .optional(),
  })
  .required();

export const tripId = joi
  .object({
    tripId: joi.string().custom(validateObjectId),
  })
  .required();

export const completeValidationSchema = joi
  .object({
    fullName: joi.string().min(3).max(20),
    email: joi.string().email(),
    nationalID: joi.string().min(14),
    city: joi.string().custom(validateObjectId),
    country: joi.string().custom(validateObjectId),
    phone: joi
      .string()
      .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/),
    profileImage: joi
      .array()
      .items(generalFields.file)
      .max(1)

      .messages({
        "array.base": "Service media is empty!.",
        "array.max": "You can upload at most one file.",
        "any.required": "File is required.",
      }),
    IDPhoto: joi.array().items(generalFields.file).max(1).messages({
      "array.base": "Service media is empty!.",
      "array.max": "You can upload at most one file.",
      "any.required": "File is required.",
    }),

    FictionAndSimile: joi.array().items(generalFields.file).max(1).messages({
      "array.base": "Service media is empty!.",
      "array.max": "You can upload at most one file.",
      "any.required": "File is required.",
    }),

    DrugAnalysis: joi.array().items(generalFields.file).max(1).messages({
      "array.base": "Service media is empty!.",
      "array.max": "You can upload at most one file.",
      "any.required": "File is required.",
    }),

    MaintenanceGuarantee: joi
      .array()
      .items(generalFields.file)
      .max(1)
      .messages({
        "array.base": "Service media is empty!.",
        "array.max": "You can upload at most one file.",
        "any.required": "File is required.",
      }),
  })
  .required();
