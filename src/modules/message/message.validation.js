import joi from "joi";
import { validateObjectId } from "../../middleware/validation";

export const getMessages = joi.object({
  otherUserId: joi.string().custom(validateObjectId),
});

export const sendMessage = joi.object({
  receiverId: joi.string().custom(validateObjectId).required(),
  message: joi.string().required(),
});
