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

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data as T;
}
export async function registerUser( email: string, password: string, tenantId: string): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenantId }),
  });
  return handleResponse<RegisterResponse>(response);
}

export async function loginUser( email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(response);
}
