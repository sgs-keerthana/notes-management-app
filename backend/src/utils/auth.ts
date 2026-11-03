import Boom from "@hapi/boom";
import type { Request } from "@hapi/hapi";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
}

export function getAuthenticatedUser(request: Request):AuthenticatedUser{
  const credentials = request.auth.credentials as Partial<AuthenticatedUser>;
  if(
    typeof credentials.userId !=="string" || typeof credentials.tenantId !=="string"
  ){
    throw Boom.unauthorized("Invalid authentication credentials");
  }
  return{
    userId: credentials.userId,
    tenantId: credentials.tenantId
  };
}