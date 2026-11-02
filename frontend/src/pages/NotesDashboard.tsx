import { useMemo, useState, type FormEvent } from "react";
import {useMutation,useQuery,useQueryClient,} from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import {AllCommunityModule,ModuleRegistry,type ColDef,type ICellRendererParams,} from "ag-grid-community";
import {fetchNotes,createNote,updateNote,updateNotePriority,deleteNote,type Note,type Priority,} from "../api/notesApi";
import { fetchMyTenants, switchTenant, type UserTenant,} from "../api/authApi";
import { useNavigate,useSearchParams } from "react-router-dom";

ModuleRegistry.registerModules([AllCommunityModule]);

interface NotesDashboardProps {
  token: string;
  onLogout: () => void;
  onTenantSwitch: (newToken: string, tenantId: string) => void;
}

const priorities: Priority[] = ["Low", "Medium", "High"];

function getNextPriority(current: Priority): Priority {
  const index = priorities.indexOf(current);
  return priorities[(index + 1) % priorities.length];
}

export default function NotesDashboard({
  token,
  onLogout,
  onTenantSwitch,
}: NotesDashboardProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Note form states
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [formError, setFormError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [ searchParams,setSearchParams] = useSearchParams();
  // Tenant states
  const [selectedTenantId, setSelectedTenantId] = useState(
    () => localStorage.getItem("selectedTenantId") || ""
  );
  const [tenantError, setTenantError] = useState("");

  // Fetch notes for the current token
  const notesQuery = useQuery<Note[], Error>({
    queryKey: ["notes", token],
    queryFn: () => fetchNotes(token),
    enabled: Boolean(token),
  });

  // Fetch tenants belonging to the logged-in user
  const tenantsQuery = useQuery<UserTenant[], Error>({
    queryKey: ["my-tenants", token],
    queryFn: () => fetchMyTenants(token),
    enabled: Boolean(token),
  });

  // Filter notes
  const filteredNotes = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return (notesQuery.data ?? []).filter(
      (note) =>
        note.title.toLowerCase().includes(search) ||
        note.content.toLowerCase().includes(search)
    );
  }, [notesQuery.data, searchTerm]);

  // Close note form
  function closeForm() {
    setShowForm(false);
    setEditingNote(null);
    setTitle("");
    setContent("");
    setPriority("Medium");
    setFormError("");
  }

  // Open create form
  function openCreateForm() {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setPriority("Medium");
    setFormError("");
    setShowForm(true);
  }

  // Open edit form
  function openEditForm(note: Note) {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setPriority(note.priority);
    setFormError("");
    setShowForm(true);
  }

  // Create note
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

    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  // Update note
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

    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  // Update priority
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

  // Delete note
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNote(token, id),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["notes", token],
      }),
  });

  // Switch tenant
  const tenantSwitchMutation = useMutation({
    mutationFn: (tenantId: string) =>
      switchTenant(token, tenantId),

    onSuccess: (response) => {
      const newTenantId = response.user.tenantId;

      setSelectedTenantId(newTenantId);
      setTenantError("");

      // Update token and selected tenant in App
      onTenantSwitch(response.token, newTenantId);

      // Reset previous tenant's form and search
      closeForm();
      setSearchTerm("");
    },

    onError: (error: Error) => {
      setTenantError(error.message);
    },
  });

  // Submit note form
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

  // AG Grid columns
  const columnDefs = useMemo<ColDef<Note>[]>(
    () => [
      {
        field: "title",
        headerName: "Title",
        flex: 1,
        minWidth: 160,
        wrapText: true,
        autoHeight: true,
        cellClass: "font-semibold text-gray-800",
      },
      {
        field: "content",
        headerName: "Content",
        flex: 2,
        minWidth: 250,
        wrapText: true,
        autoHeight: true,
        cellClass: "text-gray-600",
      },
      {
        field: "priority",
        headerName: "Priority",
        width: 140,
        filter: true,

        cellRenderer: (
          params: ICellRendererParams<Note, Priority>
        ) => {
          if (!params.value) return null;

          const badgeClass =
            params.value === "High"
              ? "bg-red-50 text-red-700"
              : params.value === "Medium"
                ? "bg-amber-50 text-amber-800"
                : "bg-green-50 text-green-700";

          return (
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}
            >
              {params.value}
            </span>
          );
        },
      },
      {
        headerName: "Actions",
        width: 290,
        minWidth: 290,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,

        cellRenderer: (params: ICellRendererParams<Note>) => {
          const note = params.data;

          if (!note) return null;

          return (
            <div className="flex h-full items-center gap-2">
              <button
                type="button"
                onClick={() => openEditForm(note)}
                className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
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
                className="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
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
                className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    [priorityMutation.isPending, deleteMutation.isPending]
  );

  // Default column settings
  const defaultColDef = useMemo<ColDef<Note>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  const saving =
    createMutation.isPending || updateMutation.isPending;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              My Notes
            </h1>

            <p className="mt-2 text-gray-600">
              Create and manage your notes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* Tenant Dropdown */}
            <select
              value={selectedTenantId}
              onChange={(event) => {
                const tenantId = event.target.value;

                if (tenantId && tenantId !== selectedTenantId) {
                  setTenantError("");
                  localStorage.setItem("selectedTenantId",tenantId);
                  setSearchParams({tenantId});
                  tenantSwitchMutation.mutate(tenantId);
                }
              }}
              disabled={
                tenantsQuery.isPending ||
                tenantSwitchMutation.isPending
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none focus:border-blue-500 disabled:opacity-50"
            >
              {tenantsQuery.isPending && (
                <option value="">Loading tenants...</option>
              )}

              {tenantsQuery.data?.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>

            {/* Create Note */}
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              + Create Note
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={() => {
                const tenantId=searchParams.get("tenantId") || selectedTenantId||"";
                if(tenantId){
                  localStorage.setItem("selectedTenantId",tenantId);
                }
                onLogout();
                navigate(tenantId?`/login?tenantId=${encodeURIComponent(tenantId)}`:"/login" ,{ replace: true });
              }}
              className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100"
            >
              Log Out
            </button>
          </div>
        </header>

        {/* Tenant errors */}
        {tenantError && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
            Tenant switching failed: {tenantError}
          </p>
        )}

        {tenantsQuery.isError && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
            Unable to load tenants: {tenantsQuery.error.message}
          </p>
        )}

        {tenantSwitchMutation.isPending && (
          <p className="mb-4 text-sm text-blue-600">
            Switching tenant and loading notes...
          </p>
        )}

        {/* Search */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label
            htmlFor="search-notes"
            className="mb-2 block font-medium text-gray-700"
          >
            Search Notes
          </label>

          <input
            id="search-notes"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title or content..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
          />
        </section>

        {/* Loading */}
        {notesQuery.isPending && (
          <p className="py-10 text-center text-gray-600">
            Loading notes...
          </p>
        )}

        {/* Notes error */}
        {notesQuery.isError && (
          <p className="rounded-lg bg-red-50 p-4 text-red-700">
            Unable to load notes: {notesQuery.error.message}
          </p>
        )}

        {/* No notes */}
        {notesQuery.isSuccess && filteredNotes.length === 0 && (
          <section className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {searchTerm.trim()
                ? "No matching notes"
                : "No notes yet"}
            </h2>

            <p className="mt-2 text-gray-600">
              {searchTerm.trim()
                ? "Try a different search term."
                : "Click Create Note to add your first note."}
            </p>
          </section>
        )}

        {/* Notes Grid */}
        {notesQuery.isSuccess && filteredNotes.length > 0 && (
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="font-semibold text-gray-800">
                Notes Data Grid
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredNotes.length}{" "}
                {filteredNotes.length === 1 ? "note" : "notes"} found
              </p>
            </div>

            <div
              className="ag-theme-quartz w-full"
              style={{ height: 520, minWidth: 0 }}
            >
              <AgGridReact<Note>
                rowData={filteredNotes}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                getRowId={(params) => params.data.id}
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 20, 50]}
                animateRows={true}
                theme="legacy"
                overlayNoRowsTemplate="No notes available"
              />
            </div>
          </section>
        )}

        {/* Priority error */}
        {priorityMutation.isError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">
            Priority update failed: {priorityMutation.error.message}
          </p>
        )}

        {/* Delete error */}
        {deleteMutation.isError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">
            Delete failed: {deleteMutation.error.message}
          </p>
        )}
      </div>

      {/* Create / Edit Note Modal */}
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
              {/* Title */}
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

              {/* Content */}
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

              {/* Priority */}
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

              {/* Form error */}
              {formError && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </p>
              )}

              {/* Form buttons */}
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
