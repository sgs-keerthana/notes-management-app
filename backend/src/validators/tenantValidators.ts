import Joi from "joi";

export const createTenantSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
});
export const updateTenantSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
});
export const tenantIdSchema = Joi.object({
    id: Joi.string().uuid().required(),
});