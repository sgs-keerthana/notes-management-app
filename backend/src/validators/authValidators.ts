import Joi from "joi";

export const registerSchema = Joi.object({
  email: Joi.string().trim().email().max(255).required(),
  password: Joi.string().min(8).max(72).required(),
  tenantId: Joi.string().uuid().required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().max(255).required(),
  password: Joi.string().min(1).max(72).required(),
});
