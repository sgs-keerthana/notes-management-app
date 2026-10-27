import type { ServerRoute } from "@hapi/hapi";
import { getTenants, createTenant, updateTenant, deleteTenant,} from "../handlers/tenantHandlers";
import {createTenantSchema,updateTenantSchema,tenantIdSchema} from "../validators/tenantValidators";

export const tenantRoutes: ServerRoute[] = [
  {
    method: "GET",
    path: "/tenants",
    handler: getTenants,
  },
  {
    method: "POST",
    path: "/tenants",
    options: {
      validate: {
        payload: createTenantSchema,
      },
    },
    handler: createTenant,
  },
  {
    method: "PUT",
    path: "/tenants/{id}",
    options: {
      validate: {
        params: tenantIdSchema,
        payload: updateTenantSchema,
      },
    },
    handler: updateTenant,
  },
  {
    method: "DELETE",
    path: "/tenants/{id}",
    options: {
      validate: {
        params: tenantIdSchema,
      },
    },
    handler: deleteTenant,
  },
];
