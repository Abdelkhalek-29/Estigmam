import joi from "joi";
import { validateObjectId } from "../../middleware/validation.js";

export const registerSchema = joi
  .object({
    fullName: joi
      .string()
      .min(3)
      .max(20)
      .messages({
        "string.base": "Full name must be a string.",
        "string.empty": "Full name cannot be empty.",
        "string.min": "Full name must be at least 3 characters long.",
        "string.max": "Full name must be at most 20 characters long.",
        "any.required": "Full name is required.",
      })
      .required(),
    userName: joi
      .string()
      .regex(/^[a-zA-Z0-9._]+$/)
      .trim()
      .min(5)
      .max(15)
      .messages({
        "string.base": "Username must be a string.",
        "string.empty": "Username cannot be empty.",
        "string.pattern.base":
          "Username can only contain letters, numbers, dots, and underscores.",
        "string.min": "Username must be at least 5 characters long.",
        "string.max": "Username must be at most 15 characters long.",
        "any.required": "Username is required.",
      })
      .required(),
    email: joi
      .string()
      .email()
      .messages({
        "string.email": "Email must be a valid email address.",
        "string.empty": "Email cannot be empty.",
        "any.required": "Email is required.",
      })
      .required(),
    city: joi
      .string()
      .custom(validateObjectId)
      .messages({
        "any.required": "City is required",
      })
      .required(),
    country: joi
      .string()
      .custom(validateObjectId)
      .messages({
        "any.required": "Country is required",
      })
      .required(),
    password: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .messages({
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
        "string.empty": "Password cannot be empty.",
        "any.required": "Password is required.",
      })
      .required(),
    confirmPassword: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .valid(joi.ref("password"))
      .messages({
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
        "string.empty": "Password cannot be empty.",
        "any.required": "Password is required.",
        "any.only": "Passwords do not match.",
      })
      .required(),
    phone: joi
      .string()
      .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .messages({
        "string.pattern.base":
          'Phone number "{#value}" is invalid. It must match the required pattern: +123-456-7890 or similar.',
        "string.empty": "Phone number cannot be empty.",
        "any.required": "Phone number is required.",
      })
      .required(),
    phoneWithCode: joi
      .string()
      .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/),
  })
  .required();

export const login = joi
  .object({
    phone: joi
      .string()
      .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .messages({
        "string.pattern.base":
          'Phone number "{#value}" is invalid. It must match the required pattern: +123-456-7890 or similar.',
        "string.empty": "Phone number cannot be empty.",
        "any.required": "Phone number is required.",
      })
      .required(),
    password: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .messages({
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
        "string.empty": "Password cannot be empty.",
        "any.required": "Password is required.",
      })
      .required(),
  })
  .required();

export const verify = joi
  .object({
    forgetCode: joi
      .string()
      .messages({
        "string.empty": "Forget code cannot be empty.",
        "any.required": "Forget code is required.",
      })
      .required(),
  })
  .required();
export const sendForgetCode = joi
  .object({
    phone: joi
      .string()
      .regex(/^[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .messages({
        "string.pattern.base":
          'Phone number "{#value}" is invalid. It must match the required pattern: (123)-456-7890 or similar.',
        "string.empty": "Phone number cannot be empty.",
        "any.required": "Phone number is required.",
      })
      .required(),
  })
  .required();
// export const updateProfileImage = joi
//   .object({
//     size: joi.number().positive().required(),
//     path: joi.string().required(),
//     filename: joi.string().required(),
//     destination: joi.string().required(),
//     mimetype: joi.string().required(),
//     encoding: joi.string().required(),
//     originalname: joi.string().required(),
//     fieldname: joi.string().required(),
//     userName: joi
//       .string()
//       .regex(/^[a-zA-Z0-9._]+$/)
//       .trim()
//       .min(5)
//       .max(15)
//       .messages({
//         "string.base": "Username must be a string.",
//         "string.empty": "Username cannot be empty.",
//         "string.pattern.base":
//           "Username can only contain letters, numbers, dots, and underscores.",
//         "string.min": "Username must be at least 5 characters long.",
//         "string.max": "Username must be at most 15 characters long.",
//         "any.required": "Username is required.",
//       }),
//     email: joi.string().email().messages({
//       "string.email": "Email must be a valid email address.",
//       "string.empty": "Email cannot be empty.",
//       "any.required": "Email is required.",
//     }),
//     city: joi.string().custom(validateObjectId).messages({
//       "any.required": "City is required",
//     }),
//     country: joi.string().custom(validateObjectId).messages({
//       "any.required": "Country is required",
//     }),
//     phone: joi
//       .string()
//       .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
//       .messages({
//         "string.pattern.base":
//           'Phone number "{#value}" is invalid. It must match the required pattern: +123-456-7890 or similar.',
//         "string.empty": "Phone number cannot be empty.",
//         "any.required": "Phone number is required.",
//       }),
//   })
//   .required();

export const resetPassword = joi
  .object({
    password: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .messages({
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
        "string.empty": "Password cannot be empty.",
        "any.required": "Password is required.",
      })
      .required(),
    confirmPassword: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .valid(joi.ref("password"))
      .messages({
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
        "string.empty": "Password cannot be empty.",
        "any.required": "Password is required.",
        "any.only": "Passwords do not match.",
      })
      .required(),

    OldPassword: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .messages({
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
        "string.empty": "Password cannot be empty.",
        "any.required": "Password is required.",
      }),
  })
  .required();
