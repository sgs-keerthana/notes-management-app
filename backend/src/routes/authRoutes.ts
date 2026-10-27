import type { ServerRoute } from "@hapi/hapi";
import { register, login } from "../handlers/authHandlers";
import {registerSchema,loginSchema,} from "../validators/authValidators";

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
];
