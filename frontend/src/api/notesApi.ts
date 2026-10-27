const API_URL = "http://localhost:5000/notes";
export type Priority = "Low" | "Medium" | "High";

export interface Note {
  id: string;
  title: string;
  content: string;
  priority: Priority;
  userId: string;
  tenantId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NoteInput {
  title: string;
  content: string;
  priority: Priority;
}

async function request<T>(token: string,path = "",options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? "Notes request failed");
  }
  return data as T;
}

export async function fetchNotes(token: string): Promise<Note[]> {
  return request<Note[]>(token);
}
export async function createNote(token: string,input: NoteInput): Promise<{ message: string; note: Note }> {
  return request(token, "", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateNote(token: string,id: string,input: Partial<NoteInput>): Promise<{ message: string; note: Note }> {
  return request(token, `/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function updateNotePriority( token: string, id: string, priority: Priority): Promise<{ message: string; note: Note }> {
  return request(token, `/${id}/priority`, {
    method: "PATCH",
    body: JSON.stringify({ priority }),
  });
}

export async function deleteNote(token: string,id: string): Promise<{ message: string }> {
  return request(token, `/${id}`, {
    method: "DELETE",
  });
}
