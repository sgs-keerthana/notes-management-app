import Boom from "@hapi/boom";
import type { Request, ResponseToolkit } from "@hapi/hapi";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Tenant, User, UserTenant } from "../models";
import { sequelize } from "../config/database";

interface RegisterPayload {
  email: string;
  password: string;
  tenantId: string;
}

interface LoginPayload {
  email: string;
  password: string;
  tenantId: string;
}

interface AddTenantPayload{
  email: string;
  tenantId: string;
}
interface SwitchTenantPayload{
  tenantId: string;
}
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret === "JWT_SECRET") {
    throw new Error("Configure a strong JWT_SECRET in your .env file");
  }
  return secret;
}

// POST /auth/register
export const register = async ( request: Request,h: ResponseToolkit) => {
  const { email, password, tenantId } =
    request.payload as RegisterPayload;
  const normalizedEmail = email.trim().toLowerCase();
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw Boom.notFound("Selected tenant does not exist");
  }
  const existingUser = await User.findOne({
    where: { email: normalizedEmail },
  });

  // Existing user: check whether already connected to this tenant.
  if (existingUser) {
    const existingMembership = await UserTenant.findOne({
      where: {
        userId: existingUser.get("id"),
        tenantId,
      },
    });
    if (existingMembership) {
      throw Boom.conflict("User already belongs to this tenant.Add to another tenant.");
    }
    // Add existing user to another tenant.
    await UserTenant.create({ userId: existingUser.get("id"),tenantId,});
    return h.response({
      message: "Existing user added to the selected tenant",
      user: {
        id: existingUser.get("id"),
        email: existingUser.get("email"),
        tenantId,
      },
    }).code(200);
  }

  // New user: create user and tenant membership together.
  const transaction = await sequelize.transaction();

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create(
      {
        email: normalizedEmail,
        passwordHash,
        tenantId, // Legacy users.tenantId column is still NOT NULL.
      },
      { transaction }
    );

    await UserTenant.create(
      {
        userId: user.get("id"),
        tenantId,
      },
      { transaction }
    );

    await transaction.commit();

    return h.response({
      message: "Registration successful",
      user: {
        id: user.get("id"),
        email: user.get("email"),
        tenantId,
      },
    }).code(201);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// POST /auth/login
export const login = async (request: Request) => {
  const { email, password, tenantId } =
    request.payload as LoginPayload;
  const normalizedEmail = email.trim().toLowerCase();
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw Boom.notFound("Selected tenant does not exist");
  }
  const user = await User.findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw Boom.unauthorized("Invalid email or password");
  }
  const passwordHash = user.get("passwordHash");
  if (
    typeof passwordHash !== "string" ||
    !(await bcrypt.compare(password, passwordHash))
  ) {
    throw Boom.unauthorized("Invalid email or password");
  }

  // Verify that the user belongs to the selected tenant.
  const membership = await UserTenant.findOne({
    where: {
      userId: user.get("id"),
      tenantId,
    },
  });

  if (!membership) {
    throw Boom.forbidden(
      "This user does not belong to the selected tenant"
    );
  }

  const token = jwt.sign(
    {
      userId: user.get("id"),
      tenantId,
    },
    getJwtSecret(),
    { expiresIn: "1h" }
  );
  return {
    message: "Login successful",
    token,
    user: {
      id: user.get("id"),
      email: user.get("email"),
      tenantId,
    },
  };
};

// POST /auth/add-tenant
export const addTenant = async (request: Request, h: ResponseToolkit) => {
  const { email, tenantId } = request.payload as AddTenantPayload;
  const normalizedEmail = email.trim().toLowerCase();

  // Check whether tenant exists.
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw Boom.notFound("Selected tenant does not exist");
  }

  // Check whether user exists.
  const user = await User.findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw Boom.notFound("User does not exist");
  }

  // Check existing membership.
  const membership = await UserTenant.findOne({
    where: {
      userId: user.get("id"),
      tenantId,
    },
  });

  if (membership) {
    throw Boom.conflict("User already belongs to this tenant Add to another tenant");
  }

  // Create user-tenant mapping.
  await UserTenant.create({
    userId: user.get("id"),
    tenantId,
  });

  return h.response({
    message: "User successfully added to the selected tenant",
    user: {
      id: user.get("id"),
      email: user.get("email"),
      tenantId,
    },
  }).code(200);
};
// GET /auth/my-tenants
export const getMyTenants = async (request: Request, h: ResponseToolkit) => {
  // Get the logged-in user's ID from the JWT.
  const credentials = request.auth.credentials as {
    userId?: string;
  };

  const userId = credentials.userId;

  if (!userId) {
    throw Boom.unauthorized("Invalid authentication token");
  }

  // Find all tenant memberships for this user.
  const memberships = await UserTenant.findAll({
    where: { userId },
  });

  // Retrieve tenant details.
  const tenants = await Promise.all(
    memberships.map(async (membership) => {
      const tenantId = membership.get("tenantId") as string;
      const tenant = await Tenant.findByPk(tenantId);

      if (!tenant) {
        return null;
      }

      return {
        id: tenant.get("id"),
        name: tenant.get("name"),
      };
    })
  );

  return h.response(
    tenants.filter((tenant) => tenant !== null)
  ).code(200);
};


// POST /auth/switch-tenant
export const switchTenant = async (
  request: Request,
  h: ResponseToolkit
) => {
  const credentials = request.auth.credentials as {
    userId?: string;
  };

  const userId = credentials.userId;

  if (!userId) {
    throw Boom.unauthorized("Invalid authentication token");
  }

  const { tenantId } = request.payload as SwitchTenantPayload;

  // Check whether the requested tenant exists.
  const tenant = await Tenant.findByPk(tenantId);

  if (!tenant) {
    throw Boom.notFound("Selected tenant does not exist");
  }

  // Check whether the user belongs to this tenant.
  const membership = await UserTenant.findOne({
    where: {
      userId,
      tenantId,
    },
  });

  if (!membership) {
    throw Boom.forbidden(
      "You do not have access to this tenant"
    );
  }

  // Find the user.
  const user = await User.findByPk(userId);

  if (!user) {
    throw Boom.unauthorized("User does not exist");
  }

  // Generate a new JWT for the selected tenant.
  const token = jwt.sign(
    {
      userId,
      tenantId,
    },
    getJwtSecret(),
    { expiresIn: "1h" }
  );

  return h.response({
    message: "Tenant switched successfully",
    token,
    user: {
      id: user.get("id"),
      email: user.get("email"),
      tenantId,
    },
  }).code(200);
};
