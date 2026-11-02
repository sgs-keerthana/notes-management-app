const API_URL = "http://localhost:5000/auth";

export interface AuthUser {
  id: string;
  email: string;
  tenantId: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

interface RegisterResponse {
  message: string;
  user: AuthUser;
}

interface AddTenantResponse {
  message: string;
  user: AuthUser;
}

export interface UserTenant {
  id: string;
  name: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data as T;
}

// REGISTER
export async function registerUser(
  email: string,
  password: string,
  tenantId: string
): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenantId }),
  });

  return handleResponse<RegisterResponse>(response);
}

// LOGIN
export async function loginUser(
  email: string,
  password: string,
  tenantId: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenantId }),
  });

  return handleResponse<AuthResponse>(response);
}

// ADD EXISTING USER TO ANOTHER TENANT
export async function addUserToTenant(
  email: string,
  tenantId: string
): Promise<AddTenantResponse> {
  const response = await fetch(`${API_URL}/add-tenant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, tenantId }),
  });

  return handleResponse<AddTenantResponse>(response);
}

// GET TENANTS ASSOCIATED WITH LOGGED-IN USER
export async function fetchMyTenants(
  token: string
): Promise<UserTenant[]> {
  const response = await fetch(`${API_URL}/my-tenants`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<UserTenant[]>(response);
}

// SWITCH TENANT
export async function switchTenant(
  token: string,
  tenantId: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/switch-tenant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tenantId }),
  });

  return handleResponse<AuthResponse>(response);
}