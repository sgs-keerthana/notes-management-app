import { useState } from "react";
import { useNavigate , useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {loginUser,registerUser,type AuthResponse,} from "../api/authApi";
import { fetchTenants } from "../api/tenantApi";

interface AuthPageProps {
  onLogin: (token: string, tenantId: string) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const navigate = useNavigate();

  const initialTenantId =
    localStorage.getItem("selectedTenantId") || "";

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tenantId, setTenantId] = useState(initialTenantId);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [tenantError, setTenantError] = useState("");
  const [ searchParams ] = useSearchParams();
  //const initialTenantId=searchParams.get("tenantId") || localStorage.getItem("selectedTenantId")||"";


  // Fetch tenants for registration.
  const {
    data: tenants = [],
    isLoading: tenantsLoading,
    isError: tenantsError,
  } = useQuery({
    queryKey: ["tenants"],
    queryFn: fetchTenants,
    enabled: isRegister,
  });

  function switchMode(registerMode: boolean) {
    setIsRegister(registerMode);

    setEmail("");
    setPassword("");
    setConfirmPassword("");

    setTenantId(
      searchParams.get("tenantId") ||
      localStorage.getItem("selectedTenantId") || ""
    );

    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setTenantError("");

    setErrorMessage("");
    setSuccessMessage("");
  }

  function validateEmail(value: string): string {
    const trimmedEmail = value.trim();

    if (!trimmedEmail) {
      return "Email is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      return "Please enter a valid email address.";
    }

    return "";
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();
    let hasError = false;

    // Email validation.
    const currentEmailError = validateEmail(trimmedEmail);
    setEmailError(currentEmailError);

    if (currentEmailError) {
      hasError = true;
    }

    // Password validation.
    if (!password.trim()) {
      setPasswordError("Password is required.");
      hasError = true;
    } else if (isRegister && password.length < 8) {
      setPasswordError(
        "Password must contain at least 8 characters."
      );
      hasError = true;
    } else if (password.length > 72) {
      setPasswordError(
        "Password cannot exceed 72 characters."
      );
      hasError = true;
    } else {
      setPasswordError("");
    }

    // Confirm password validation.
    if (isRegister && !confirmPassword) {
      setConfirmPasswordError(
        "Please confirm your password."
      );
      hasError = true;
    } else if (
      isRegister &&
      password !== confirmPassword
    ) {
      setConfirmPasswordError(
        "Passwords do not match."
      );
      hasError = true;
    } else {
      setConfirmPasswordError("");
    }

    // Tenant validation - registration only.
    if (isRegister && !tenantId) {
      setTenantError(
        "Please select a tenant to continue."
      );
      hasError = true;
    } else {
      setTenantError("");
    }

    if (hasError) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        // Register user with the selected tenant.
        const response = await registerUser(
          trimmedEmail,
          password,
          tenantId
        );

        localStorage.setItem(
          "selectedTenantId",
          tenantId
        );

        setSuccessMessage(
          response.message ||
            "Registration successful! You can now log in."
        );

        setIsRegister(false);

        setPassword("");
        setConfirmPassword("");

        setPasswordError("");
        setConfirmPasswordError("");
      } else {
        // Login using the stored tenant ID.
        const storedTenantId =
          localStorage.getItem("selectedTenantId") ||
          "";

        if (!storedTenantId) {
          setErrorMessage(
            "No tenant is selected. Please register or select a tenant first."
          );
          return;
        }

        const response: AuthResponse = await loginUser(
          trimmedEmail,
          password,
          storedTenantId
        );

        // Store JWT and selected tenant through App.
        onLogin(
          response.token,
          response.user.tenantId
        );

        navigate(`/notes?tenantId=${encodeURIComponent(response.user.tenantId)}`, { replace: true });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "";

      if (!isRegister) {
        setErrorMessage(
          message ||
            "Login failed. Please check your credentials."
        );
      } else {
        setErrorMessage(
          message ||
            "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-gray-100 px-4 py-10">
      <section className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
          {isRegister
            ? "Create an Account"
            : "Welcome Back"}
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

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5"
        >
          {/* Email */}
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
              onChange={(event) => {
                const value = event.target.value;
                setEmail(value);

                setEmailError(
                  value.trim()
                    ? validateEmail(value)
                    : ""
                );
              }}
              onBlur={() => {
                if (email.trim()) {
                  setEmailError(
                    validateEmail(email)
                  );
                }
              }}
              placeholder="Enter your email"
              autoComplete="off"
              aria-invalid={Boolean(emailError)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            {emailError && (
              <p className="mt-1 text-sm text-red-600">
                {emailError}
              </p>
            )}
          </div>

          {/* Tenant selection - Register only */}
          {isRegister && (
            <div>
              <label
                htmlFor="tenant"
                className="mb-1 block font-medium text-gray-700"
              >
                Workspace / Tenant
              </label>

              <select
                id="tenant"
                value={tenantId}
                onChange={(event) => {
                  setTenantId(event.target.value);
                  setTenantError("");
                }}
                disabled={
                  tenantsLoading || tenantsError
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">
                  {tenantsLoading
                    ? "Loading tenants..."
                    : tenantsError
                      ? "Unable to load tenants"
                      : "Choose a tenant"}
                </option>

                {tenants.map((tenant) => (
                  <option
                    key={tenant.id}
                    value={tenant.id}
                  >
                    {tenant.name}
                  </option>
                ))}
              </select>

              {tenantsError && (
                <p className="mt-1 text-sm text-red-600">
                  Could not load tenants. Please refresh.
                </p>
              )}

              {tenantError && (
                <p className="mt-1 text-sm text-red-600">
                  {tenantError}
                </p>
              )}
            </div>
          )}

          {/* Password */}
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
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError("");
              }}
              placeholder={
                isRegister
                  ? "Create a password (minimum 8 characters)"
                  : "Enter your password"
              }
              autoComplete={
                isRegister
                  ? "new-password"
                  : "current-password"
              }
              maxLength={72}
              aria-invalid={Boolean(passwordError)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            {passwordError && (
              <p className="mt-1 text-sm text-red-600">
                {passwordError}
              </p>
            )}
          </div>

          {/* Confirm Password - Register only */}
          {isRegister && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block font-medium text-gray-700"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  const value = event.target.value;
                  setConfirmPassword(value);
                  if (value===""){
                    setConfirmPasswordError("");
                  } else if(value !== password){
                    setConfirmPasswordError("Passwords do not match.");
                  } else{
                    setConfirmPassword("");
                  }
                }}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                maxLength={72}
                aria-invalid={Boolean(confirmPasswordError)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

              {confirmPasswordError && (
                <p className="mt-1 text-sm text-red-600">
                  {confirmPasswordError}
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              (isRegister &&
                (tenantsLoading || tenantsError))
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

        {/* Switch Login / Register */}
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

