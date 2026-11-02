import type { ServerRoute } from "@hapi/hapi";
import { register, login, addTenant,getMyTenants, switchTenant} from "../handlers/authHandlers";
import { registerSchema, loginSchema, addTenantSchema,switchTenantSchema} from "../validators/authValidators";

export const authRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/auth/register",
    options: {
      validate: {
        payload: registerSchema,
      },
    },
    handler: register,
  },
  {
    method: "POST",
    path: "/auth/login",
    options: {
      validate: {
        payload: loginSchema,
      },
    },
    handler: login,
  },
  {
    method: "POST",
    path: "/auth/add-tenant",
    options: {
      validate: {
        payload: addTenantSchema,
      },
    },
    handler: addTenant,
  },
  {
    method: "GET",
    path: "/auth/my-tenants",
    options:{
      auth: "jwt",
    },
    handler: getMyTenants,
  },
  {
    method: "POST",
    path: "/auth/switch-tenant",
    options:{
      auth:"jwt",
      validate:{
        payload: switchTenantSchema,
      },
    },
    handler: switchTenant,
  }
];
