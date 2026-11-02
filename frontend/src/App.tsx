import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes,} from "react-router-dom";
import {QueryClient,QueryClientProvider,} from "@tanstack/react-query";
import TenantManagement from "./pages/TenantManagement";
import AuthPage from "./pages/AuthPage";
import NotesDashboard from "./pages/NotesDashboard";

const queryClient = new QueryClient();

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  // Called after successful login
  function handleLogin(newToken: string, tenantId: string) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("selectedTenantId", tenantId);
    setToken(newToken);
  }

  // Called when the user logs out
  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    queryClient.clear();
  }

  // Called when the user switches tenants
  function handleTenantSwitch(
    newToken: string,
    tenantId: string
  ) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("selectedTenantId", tenantId);
    setToken(newToken);
    queryClient.clear();
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Tenant Management */}
          <Route
            path="/tenants"
            element={<TenantManagement />}
          />

          {/* Login */}
          <Route
            path="/login"
            element={
              token ? (
                <Navigate
                  to={`/notes?tenantId=${encodeURIComponent(
                    localStorage.getItem("selectedTenantId") || ""
                  )}`}
                  replace
                />
              ) : (
                <AuthPage onLogin={handleLogin} />
              )
            }
          />

          {/* Notes Page */}
          <Route
            path="/notes"
            element={
              token ? (
                <NotesDashboard
                  token={token}
                  onLogout={handleLogout}
                  onTenantSwitch={handleTenantSwitch}
                />
              ) : (
                <Navigate
                  to={`/login?tenantId=${encodeURIComponent(
                    localStorage.getItem("selectedTenantId") || ""
                  )}`}
                  replace
                />
              )
            }
          />

          {/* Default Route */}
          <Route
            path="/"
            element={
              <Navigate
                to={
                  token
                    ? `/notes?tenantId=${encodeURIComponent(
                        localStorage.getItem("selectedTenantId") || ""
                      )}`
                    : "/login"
                }
                replace
              />
            }
          />

          {/* Unknown Route */}
          <Route
            path="*"
            element={
              <Navigate
                to={
                  token
                    ? `/notes?tenantId=${encodeURIComponent(
                        localStorage.getItem("selectedTenantId") || ""
                      )}`
                    : "/login"
                }
                replace
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;