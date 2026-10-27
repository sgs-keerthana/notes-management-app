import type { ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import {
  getNotes,
  createNote,
  updateNote,
  updateNotePriority,
  deleteNote,
} from "../handlers/notesHandlers";

const notePayloadSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  content: Joi.string().trim().min(1).required(),
  priority: Joi.string().valid("Low", "Medium", "High")
    .default("Medium"),
});

const updateNoteSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  content: Joi.string().trim().min(1),
  priority: Joi.string().valid("Low", "Medium", "High"),
}).min(1);

const prioritySchema = Joi.object({
  priority: Joi.string()
    .valid("Low", "Medium", "High")
    .required(),
});

const idSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const notesRoutes: ServerRoute[] = [
  {
    method: "GET",
    path: "/notes",
    handler: getNotes,
  },
  {
    method: "POST",
    path: "/notes",
    options: {
      validate: { payload: notePayloadSchema },
    },
    handler: createNote,
  },
  {
    method: "PUT",
    path: "/notes/{id}",
    options: {
      validate: {
        params: idSchema,
        payload: updateNoteSchema,
      },
    },
    handler: updateNote,
  },
  {
    method: "PATCH",
    path: "/notes/{id}/priority",
    options: {
      validate: {
        params: idSchema,
        payload: prioritySchema,
      },
    },
    handler: updateNotePriority,
  },
  {
    method: "DELETE",
    path: "/notes/{id}",
    options: {
      validate: { params: idSchema },
    },
    handler: deleteNote,
  },
];
