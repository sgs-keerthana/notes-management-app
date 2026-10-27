import Boom from "@hapi/boom";
import type { Request, ResponseToolkit } from "@hapi/hapi";
import { Note } from "../models";
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

  return Note.findAll({
    where: { userId, tenantId },
    order: [["createdAt", "DESC"]],
  });
};

// POST /notes
export const createNote = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { userId, tenantId } = getAuthenticatedUser(request);
  const { title, content, priority } =
    request.payload as NotePayload;

  const note = await Note.create({
    title,
    content,
    priority: priority ?? "Medium",
    userId,
    tenantId,
  });

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

  const note = await Note.findOne({
    where: { id, userId, tenantId },
  });

  if (!note) {
    throw Boom.notFound("Note not found");
  }

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

  await note.update(updates);

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

  const note = await Note.findOne({
    where: { id, userId, tenantId },
  });

  if (!note) {
    throw Boom.notFound("Note not found");
  }

  await note.update({ priority });

  return {
    message: "Note priority updated successfully",
    note,
  };
};

// DELETE /notes/{id}
export const deleteNote = async (request: Request) => {
  const { userId, tenantId } = getAuthenticatedUser(request);
  const id = getNoteId(request);

  const note = await Note.findOne({
    where: { id, userId, tenantId },
  });

  if (!note) {
    throw Boom.notFound("Note not found");
  }

  await note.destroy();

  return {
    message: "Note deleted successfully",
  };
};
