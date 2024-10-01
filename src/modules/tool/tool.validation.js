import Joi from "joi";

export const createTool = Joi.object({
  name: Joi.string().max(20).required(),
  type: Joi.string().valid("yacht", "boat", "jet boat", "jet ski").required(),
  portName: Joi.string().required(),
  details: Joi.string(),
  location: Joi.object({
    Longitude: Joi.number().required(),
    Latitude: Joi.number().required(),
  }),
}).required();
