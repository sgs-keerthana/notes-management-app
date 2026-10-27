import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {useMutation,useQuery,useQueryClient,} from "@tanstack/react-query";
import { fetchTenants,createTenant,updateTenant,deleteTenant,type Tenant,} from "../api/tenantApi";

export default function TenantManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tenantName, setTenantName] = useState("");
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch all tenants
  const {data: tenants = [],isLoading,error,} = useQuery({
    queryKey: ["tenants"],
    queryFn: fetchTenants,
  });

  // Create tenant
  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: async () => {
      setTenantName("");
      setErrorMessage("");
      await queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: Error) => setErrorMessage(error.message),
  });

  // Update tenant
  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateTenant(id, name),
    onSuccess: async () => {
      setTenantName("");
      setEditingTenant(null);
      setErrorMessage("");
      await queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: Error) => setErrorMessage(error.message),
  });

  // Delete tenant
  const deleteMutation = useMutation({
    mutationFn: deleteTenant,
    onSuccess: async () => {
      setErrorMessage("");
      await queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: Error) => setErrorMessage(error.message),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = tenantName.trim();
    if (name.length < 2 || name.length > 100) {
      setErrorMessage("Tenant name must contain 2 to 100 characters.");
      return;
    }
    setErrorMessage("");

    if (editingTenant) {
      updateMutation.mutate({ id: editingTenant.id, name });
    } else {
      createMutation.mutate(name);
    }
  }

  function handleEdit(tenant: Tenant) {
    setEditingTenant(tenant);
    setTenantName(tenant.name);
    setErrorMessage("");
  }

  function handleCancelEdit() {
    setEditingTenant(null);
    setTenantName("");
    setErrorMessage("");
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-800">
          Tenant Management
        </h1>

        <p className="mb-8 text-gray-600">
          Create and manage tenants for your Notes Management App.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl bg-white p-6 shadow"
        >
          <label
            htmlFor="tenantName"
            className="mb-2 block font-medium text-gray-700"
          >
            Tenant Name
          </label>

          <input
            id="tenantName"
            type="text"
            value={tenantName}
            onChange={(event) => setTenantName(event.target.value)}
            placeholder="Enter tenant name"
            maxLength={100}
            required
            className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />
          {errorMessage && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {errorMessage}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving || deleteMutation.isPending}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : editingTenant
                  ? "Update Tenant"
                  : "Create Tenant"}
            </button>

            {editingTenant && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-lg border border-gray-300 px-5 py-3 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Existing Tenants
          </h2>

          {isLoading && <p>Loading tenants...</p>}

          {error && (
            <p role="alert" className="text-red-600">
              Failed to load tenants: {(error as Error).message}
            </p>
          )}

          {!isLoading && !error && tenants.length === 0 && (
            <p className="text-gray-500">
              No tenants found. Create your first tenant above.
            </p>
          )}

          <div className="space-y-3">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                onClick={() => navigate(`/login?tenantId=${tenant.id}`)}
                className="flex cursor-pointer flex-col justify-between gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-blue-500 hover:bg-blue-50 hover:shadow sm:flex-row sm:items-center"
            >
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {tenant.name}
                  </h3>
                  <p className="break-all text-xs text-gray-500">
                    ID: {tenant.id}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(event) => {event.stopPropagation();handleEdit(tenant)}}
                    disabled={isSaving || deleteMutation.isPending}
                    className="rounded-md border border-blue-600 px-3 py-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                      if (
                        window.confirm(
                          `Are you sure you want to delete "${tenant.name}"?`
                        )
                      ) {
                        setErrorMessage("");
                        deleteMutation.mutate(tenant.id);
                      }
                    }}
                    disabled={isSaving || deleteMutation.isPending}
                    className="rounded-md border border-red-600 px-3 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
