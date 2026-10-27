const API_URL = "http://localhost:5000/tenants";

export interface Tenant {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}
async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Something went wrong");
  }
  return response.json();
}

export async function fetchTenants(): Promise<Tenant[]> {
  const response = await fetch(API_URL);
  return handleResponse(response);
}

export async function createTenant(name: string): Promise<Tenant> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return handleResponse(response);
}

export async function updateTenant( id: string, name: string): Promise<Tenant> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return handleResponse(response);
}

export async function deleteTenant(id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}
