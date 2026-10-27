import Boom from "@hapi/boom";
import type { Request, ResponseToolkit } from "@hapi/hapi";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Tenant, User } from "../models";

interface RegisterPayload {
  email: string;
  password: string;
  tenantId: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret === "JWT_SECRET") {
    throw new Error("Configure a strong JWT_SECRET in your .env file");
  }

  return secret;
}

// POST /auth/register
export const register = async (request: Request, h: ResponseToolkit) => {
  const { email, password, tenantId } =
    request.payload as RegisterPayload;
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw Boom.badRequest("The selected tenant does not exist");
  }
  const existingUser = await User.findOne({
    where: { email: email.toLowerCase() },
  });
  if (existingUser) {
    throw Boom.conflict("An account with this email already exists");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    tenantId,
  });
  return h.response({
    message: "Registration successful",
    user: {
      id: user.get("id"),
      email: user.get("email"),
      tenantId: user.get("tenantId"),
    },
  }).code(201);
};

// POST /auth/login
export const login = async (request: Request) => {
  const { email, password } = request.payload as LoginPayload;
  const user = await User.findOne({
    where: { email: email.toLowerCase() },
  });
  if (!user) {
    throw Boom.unauthorized("Invalid email or password");
  }
  const passwordHash = user.get("passwordHash");
  if (typeof passwordHash !== "string") {
    throw Boom.unauthorized("Invalid email or password");
  }
  const passwordMatches = await bcrypt.compare(password, passwordHash);
  if (!passwordMatches) {
    throw Boom.unauthorized("Invalid email or password");
  }
  const secret = getJwtSecret();
  const token = jwt.sign(
    {
      userId: user.get("id"),
      tenantId: user.get("tenantId"),
    },
    secret,
    { expiresIn: "1h" }
  );
  return {
    message: "Login successful",
    token,
    user: {
      id: user.get("id"),
      email: user.get("email"),
      tenantId: user.get("tenantId"),
    },
  };
};
