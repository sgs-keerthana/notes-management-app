import Boom from "@hapi/boom";
import type { Request } from "@hapi/hapi";
import jwt, { type JwtPayload } from "jsonwebtoken";

interface AuthenticatedUser {
  userId: string;
  tenantId: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret === "JWT_SECRET") {
    throw new Error("Configure a strong JWT_SECRET in your .env file");
  }

  return secret;
}

export function getAuthenticatedUser(
  request: Request
): AuthenticatedUser {
  const authorization: unknown = request.headers["authorization"];

  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ")
  ) {
    throw Boom.unauthorized("Authentication token is required");
  }

  const token = authorization.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string" ||
      typeof decoded.tenantId !== "string"
    ) {
      throw Boom.unauthorized("Invalid authentication token");
    }

    return {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
    };
  } catch {
    throw Boom.unauthorized(
      "Invalid or expired authentication token"
    );
  }
}
