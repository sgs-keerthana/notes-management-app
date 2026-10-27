import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {  fetchNotes, createNote, updateNote, updateNotePriority, deleteNote, type Note,type Priority,} from "../api/notesApi";

interface NotesDashboardProps {
  token: string;
  onLogout: () => void;
}

const priorities: Priority[] = ["Low", "Medium", "High"];

function getNextPriority(current: Priority): Priority {
  const index = priorities.indexOf(current);
  return priorities[(index + 1) % priorities.length];
}

export default function NotesDashboard({token,onLogout,}: NotesDashboardProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [formError, setFormError] = useState("");

  const notesQuery = useQuery<Note[], Error>({
    queryKey: ["notes", token],
    queryFn: () => fetchNotes(token),
    enabled: Boolean(token),
  });

  function closeForm() {
    setShowForm(false);
    setEditingNote(null);
    setTitle("");
    setContent("");
    setPriority("Medium");
    setFormError("");
  }

  function openCreateForm() {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setPriority("Medium");
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(note: Note) {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setPriority(note.priority);
    setFormError("");
    setShowForm(true);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createNote(token, {
        title: title.trim(),
        content: content.trim(),
        priority,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notes", token],
      });
      closeForm();
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingNote) {
        throw new Error("Please select a note to edit.");
      }

      return updateNote(token, editingNote.id, {
        title: title.trim(),
        content: content.trim(),
        priority,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notes", token],
      });
      closeForm();
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const priorityMutation = useMutation({
    mutationFn: ({
      id,
      nextPriority,
    }: {
      id: string;
      nextPriority: Priority;
    }) => updateNotePriority(token, id, nextPriority),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["notes", token],
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNote(token, id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["notes", token],
      }),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Please enter a title.");
      return;
    }

    if (!content.trim()) {
      setFormError("Please enter note content.");
      return;
    }

    if (editingNote) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              My Notes
            </h1>
            <p className="mt-2 text-gray-600">
              Create and manage your notes.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              + Create Note
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100"
            >
              Log Out
            </button>
          </div>
        </header>

        {notesQuery.isPending && (
          <p className="py-10 text-center text-gray-600">
            Loading notes...
          </p>
        )}

        {notesQuery.isError && (
          <p className="rounded-lg bg-red-50 p-4 text-red-700">
            Unable to load notes: {notesQuery.error.message}
          </p>
        )}

        {notesQuery.isSuccess && notesQuery.data.length === 0 && (
          <section className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              No notes yet
            </h2>
            <p className="mt-2 text-gray-600">
              Click Create Note to add your first note.
            </p>
          </section>
        )}

        {notesQuery.isSuccess && notesQuery.data.length > 0 && (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {notesQuery.data.map((note) => (
              <article
                key={note.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="break-words text-xl font-semibold text-gray-800">
                    {note.title}
                  </h2>

                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {note.priority}
                  </span>
                </div>

                <p className="mt-4 flex-1 whitespace-pre-wrap break-words text-gray-600">
                  {note.content}
                </p>

                <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => openEditForm(note)}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={priorityMutation.isPending}
                    onClick={() =>
                      priorityMutation.mutate({
                        id: note.id,
                        nextPriority: getNextPriority(note.priority),
                      })
                    }
                    className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                  >
                    Change Priority
                  </button>

                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete "${note.title}"?`)) {
                        deleteMutation.mutate(note.id);
                      }
                    }}
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        {priorityMutation.isError && (
          <p className="mt-4 text-red-600">
            Priority update failed: {priorityMutation.error.message}
          </p>
        )}

        {deleteMutation.isError && (
          <p className="mt-4 text-red-600">
            Delete failed: {deleteMutation.error.message}
          </p>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onClick={closeForm}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-form-title"
            onClick={(event) => event.stopPropagation()}
            className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2
                id="note-form-title"
                className="text-2xl font-bold text-gray-800"
              >
                {editingNote ? "Edit Note" : "Create Note"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close note form"
                className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="note-title"
                  className="mb-2 block font-medium text-gray-700"
                >
                  Title
                </label>
                <input
                  id="note-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={200}
                  required
                  placeholder="Enter note title"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="note-content"
                  className="mb-2 block font-medium text-gray-700"
                >
                  Content
                </label>
                <textarea
                  id="note-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={5}
                  required
                  placeholder="Write your note..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="note-priority"
                  className="mb-2 block font-medium text-gray-700"
                >
                  Priority
                </label>
                <select
                  id="note-priority"
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as Priority)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  {priorities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingNote
                      ? "Save Changes"
                      : "Create Note"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
