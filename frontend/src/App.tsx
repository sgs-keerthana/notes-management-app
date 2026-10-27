import { useState } from "react";
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useNavigate,} from "react-router-dom";
import {QueryClient,QueryClientProvider,} from "@tanstack/react-query";
import TenantManagement from "./pages/TenantManagement";
import AuthPage from "./pages/AuthPage";
import NotesDashboard from "./pages/NotesDashboard";

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  token: string | null;
}

function ProtectedRoute({ token }: ProtectedRouteProps) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

interface AppLayoutProps {
  token: string | null;
  onLogout: () => void;
}

function AppLayout({ token, onLogout }: AppLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  function handleLogout() {
    onLogout();
    setMenuOpen(false);
    navigate("/login", { replace: true });
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/tenants"
            className="text-2xl font-bold text-blue-600"
            onClick={() => setMenuOpen(false)}
          >
            Notes Manager
          </Link>

          <button
            type="button"
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100 md:hidden"
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>

          <nav className="hidden items-center gap-5 md:flex">
            <Link
              to="/tenants"
              className="font-medium text-gray-700 hover:text-blue-600"
            >
              Tenants
            </Link>

            {token ? (
              <>
                <Link
                  to="/notes"
                  className="font-medium text-gray-700 hover:text-blue-600"
                >
                  My Notes
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                Login / Register
              </Link>
            )}
          </nav>
        </div>

        {menuOpen && (
          <nav className="space-y-1 border-t border-gray-200 bg-white px-4 py-3 md:hidden">
            <Link
              to="/tenants"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
            >
              Tenants
            </Link>

            {token ? (
              <>
                <Link
                  to="/notes"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                >
                  My Notes
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
              >
                Login / Register
              </Link>
            )}
          </nav>
        )}
      </header>
      <Outlet />
    </div>
  );
}

function App() {
  // Restore the saved JWT token when the app starts.
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    queryClient.clear();
  }

  function handleLogin(newToken: string) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <AppLayout token={token} onLogout={handleLogout} />
            }
          >
            <Route
              path="/"
              element={<Navigate to="/tenants" replace />}
            />

            <Route
              path="/tenants"
              element={<TenantManagement />}
            />

            <Route
              path="/login"
              element={
                token ? (
                  <Navigate to="/notes" replace />
                ) : (
                  <AuthPage onLogin={handleLogin} />
                )
              }
            />

            <Route element={<ProtectedRoute token={token} />}>
              <Route
                path="/notes"
                element={
                  <NotesDashboard
                    token={token!}
                    onLogout={handleLogout}
                  />
                }
              />
            </Route>

            <Route
              path="*"
              element={<Navigate to="/tenants" replace />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;