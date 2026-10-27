import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { loginUser, registerUser, type AuthResponse,} from "../api/authApi";
import { fetchTenants } from "../api/tenantApi";

interface AuthPageProps {
  onLogin: (token: string) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read the tenant ID passed from the Tenants page URL.
  const selectedTenantId = searchParams.get("tenantId") ?? "";
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState(selectedTenantId);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the tenants to populate the registration dropdown.
  const {
    data: tenants = [],
    isLoading: tenantsLoading,
    isError: tenantsError,
  } = useQuery({
    queryKey: ["tenants"],
    queryFn: fetchTenants,
  });

  function switchMode(registerMode: boolean) {
    setIsRegister(registerMode);
    setErrorMessage("");
    setSuccessMessage("");
    setPassword("");
    setTenantId(searchParams.get("tenantId") ?? "");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();

    // Frontend validation.
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (isRegister && password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password.length > 72) {
      setErrorMessage("Password cannot exceed 72 characters.");
      return;
    }

    if (isRegister && !tenantId) {
      setErrorMessage("Please select a tenant.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        // Create the user under the selected tenant.
        await registerUser(trimmedEmail, password, tenantId);

        setSuccessMessage(
          "Registration successful! You can now log in."
        );

        setIsRegister(false);
        setPassword("");
      } else {
        // Log in using the registered email and password.
        const response: AuthResponse = await loginUser(
          trimmedEmail,
          password
        );

        onLogin(response.token);
        navigate("/notes", { replace: true });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-gray-100 px-4 py-10">
      <section className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
          {isRegister ? "Create an Account" : "Welcome Back"}
        </h1>

        <p className="mb-6 text-center text-gray-500">
          {isRegister
            ? "Register to start managing your notes."
            : "Log in to access your notes."}
        </p>
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-700"
          >
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label
                htmlFor="tenant"
                className="mb-1 block font-medium text-gray-700"
              >
                Select Tenant
              </label>

              <select
                id="tenant"
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
                disabled={tenantsLoading || tenantsError}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              >
                <option value="">
                  {tenantsLoading
                    ? "Loading tenants..."
                    : tenantsError
                      ? "Unable to load tenants"
                      : "Choose a tenant"}
                </option>

                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>

              {tenantsError && (
                <p className="mt-1 text-sm text-red-600">
                  Could not load tenants. Please refresh the page.
                </p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block font-medium text-gray-700"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                isRegister
                  ? "Create a password (minimum 8 characters)"
                  : "Enter your password"
              }
              autoComplete={
                isRegister ? "new-password" : "current-password"
              }
              minLength={isRegister ? 8 : undefined}
              maxLength={72}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              (isRegister && (tenantsLoading || tenantsError))
            }
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isRegister
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(!isRegister)}
            className="font-semibold text-blue-600 hover:underline"
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>

        <button
          type="button"
          onClick={() => navigate("/tenants")}
          className="mt-4 w-full text-center text-sm text-gray-500 hover:text-blue-600"
        >
          Back to Tenants
        </button>
      </section>
    </main>
  );
}
