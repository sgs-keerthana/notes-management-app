import Boom from "@hapi/boom";
import type { Request, ResponseToolkit } from "@hapi/hapi";
import { findNotes,createNoteRecord,updateNoteRecord,updatePriorityRecord,deleteNoteRecord } from "../repositories/noteRepository";
import { getAuthenticatedUser } from "../utils/auth";

interface NotePayload {
  title: string;
  content: string;
  priority?: "Low" | "Medium" | "High";
}

interface UpdateNotePayload {
  title?: string;
  content?: string;
  priority?: "Low" | "Medium" | "High";
}

function getNoteId(request: Request): string {
  const id : unknown = request.params["id"];

  if (typeof id !=="string"|| id.trim()==="") {
    throw Boom.badRequest("Note ID is required");
  }
  return id;
}

// GET /notes
export const getNotes = async (request: Request) => {
  const { userId, tenantId } = getAuthenticatedUser(request);
  const notes = await findNotes(userId,tenantId);
  return notes
};

// POST /notes
export const createNote = async ( request: Request,h: ResponseToolkit) => {
  const { userId, tenantId } = getAuthenticatedUser(request);
  const { title, content, priority } =request.payload as NotePayload;
  const note = await createNoteRecord({
    title,
    content,
    priority: priority ?? "Medium",
  },
    userId,
    tenantId,
  );
  return h.response({
    message: "Note created successfully",
    note,
  }).code(201);
};

// PUT /notes/{id}
export const updateNote = async (request: Request) => {
  const { userId, tenantId } = getAuthenticatedUser(request);
  const id = getNoteId(request);
  const payload = request.payload as UpdateNotePayload;
  const updates: UpdateNotePayload = {};
  if (payload.title !== undefined) {
    updates.title = payload.title;
  }
  if (payload.content !== undefined) {
    updates.content = payload.content;
  }
  if (payload.priority !== undefined) {
    updates.priority = payload.priority;
  }
  const note = await updateNoteRecord(
    id,
    userId,
    tenantId,
    updates
  );
  return {
    message: "Note updated successfully",
    note,
  };
};
// PATCH /notes/{id}/priority
export const updateNotePriority = async (request: Request) => {
  const { userId, tenantId } = getAuthenticatedUser(request);
  const id = getNoteId(request);
  const { priority } = request.payload as {
    priority: "Low" | "Medium" | "High";
  };
  const note = await updatePriorityRecord(
    id,
    userId,
    tenantId,
    priority
  );
  return {
    message: "Note priority updated successfully",
    note,
  };
};

// DELETE /notes/{id}
export const deleteNote = async (request: Request) => {
  const { userId, tenantId } = getAuthenticatedUser(request);
  const id = getNoteId(request);
  await deleteNoteRecord(id, userId, tenantId);
  return {
    message: "Note deleted successfully",
  };
}