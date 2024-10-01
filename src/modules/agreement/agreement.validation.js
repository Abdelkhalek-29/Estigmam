import joi from "joi";

export const addAgreement = joi.object({
  title: joi.string().required().min(4).max(50),
  description: joi.string().required().min(4).max(500),
});
