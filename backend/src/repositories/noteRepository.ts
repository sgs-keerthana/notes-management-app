import Boom from "@hapi/boom";
import { Note } from "../models";
export interface CreateNoteInput{
    title: string;
    content: string;
    priority: "Low" |"Medium"|"High";
}
export interface UpdateNoteInput{
    title?: string;
    content?: string;
    priority?: "Low"|"Medium"|"High";
}
//Get all notes for the logged-in user and selected tenant
export async function findNotes(
  userId: string,
  tenantId: string
) {
  return Note.findAll({
    where: { userId, tenantId, isDeleted: false},
    order: [["createdAt", "DESC"]],
  });
}

//Create a new note
export async function createNoteRecord(
  input: CreateNoteInput,
  userId: string,
  tenantId: string
) {
  return Note.create({
    ...input,
    userId,
    tenantId,
    isDeleted: false,
  });
}

//Find one note
export async function findNote(
  id: string,
  userId: string,
  tenantId: string
) {
  const note = await Note.findOne({
    where: { id, userId, tenantId,isDeleted: false },
  });

  if (!note) {
    throw Boom.notFound("Note not found");
  }

  return note;
}

//Update a note
export async function updateNoteRecord(
  id: string,
  userId: string,
  tenantId: string,
  updates: UpdateNoteInput
) {
  const note = await findNote(id, userId, tenantId);
  await note.update(updates);
  return note;
}

//Update note priority
export async function updatePriorityRecord(
  id: string,
  userId: string,
  tenantId: string,
  priority: "Low" | "Medium" | "High"
) {
  const note = await findNote(id, userId, tenantId);
  await note.update({ priority });
  return note;
}

//Delete a note
export async function deleteNoteRecord(
  id: string,
  userId: string,
  tenantId: string
) {
  const note = await findNote(id, userId, tenantId);
  await note.update({
    isDeleted: true,
  });
}