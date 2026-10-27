import Boom from "@hapi/boom";
import type { Request, ResponseToolkit } from "@hapi/hapi";
import { Tenant, User, Note } from "../models";

interface TenantPayload {
  name: string;
}
interface TenantParams {
  id: string;
}

// GET /tenants
export const getTenants = async (request: Request,h: ResponseToolkit) => {
  const tenants = await Tenant.findAll({
    order: [["createdAt", "DESC"]],
  });

  return tenants;
};

// POST /tenants
export const createTenant = async (request: Request,h: ResponseToolkit) => {
  const payload = request.payload as TenantPayload;
  const tenant = await Tenant.create({
    name: payload.name,
  });
  return h.response(tenant).code(201);
};

// PUT /tenants/{id}
export const updateTenant = async (request: Request) => {
  const id  = request.params["id"];
  if(typeof id !== "string"){
    throw Boom.badRequest("Invalid tenant Id");
  }
  const payload = request.payload as TenantPayload;
  const tenant = await Tenant.findByPk(id);

  if (!tenant) {
    throw Boom.notFound("Tenant not found");
  }
  await tenant.update({
    name: payload.name,
  });
  return tenant;
};

// DELETE /tenants/{id}
export const deleteTenant = async (request: Request) => {
  const id = request.params["id"];
  if(typeof id !== "string"){
    throw Boom.badRequest("Invalid tenant Id");
  }
  const tenant = await Tenant.findByPk(id);
  if (!tenant) {
    throw Boom.notFound("Tenant not found");
  }
  // Prevent accidental deletion of a tenant
  // that still has users or notes.
  const userCount = await User.count({
    where: { tenantId: id },
  });

  const noteCount = await Note.count({
    where: { tenantId: id },
  });

  if (userCount > 0 || noteCount > 0) {
    throw Boom.conflict(
      "Cannot delete a tenant that still contains users or notes"
    );
  }

  await tenant.destroy();

  return {
    message: "Tenant deleted successfully",
  };
};