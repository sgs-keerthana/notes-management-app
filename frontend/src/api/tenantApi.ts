const API_URL = "http://localhost:5000/tenants";

export interface Tenant {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data as T;
}

// Fetch tenants.
// This endpoint must allow public tenant listing for the login selector,
// or you must provide a separate public tenant-list endpoint.
export async function fetchTenants(): Promise<Tenant[]> {
  const response = await fetch(API_URL);
  return handleResponse<Tenant[]>(response);
}

export async function createTenant(name: string): Promise<Tenant> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  return handleResponse<Tenant>(response);
}

export async function updateTenant(
  id: string,
  name: string
): Promise<Tenant> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  return handleResponse<Tenant>(response);
}

export async function deleteTenant(
  id: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  return handleResponse<{ message: string }>(response);
}