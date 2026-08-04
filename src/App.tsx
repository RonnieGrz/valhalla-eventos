import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// Route-based code splitting: EventDashboardPage pulls in Recharts, so keep it
// (and every other route) out of the initial bundle — including on /login.
const EventDashboardPage = lazy(() =>
  import("./pages/EventDashboardPage").then((m) => ({ default: m.EventDashboardPage })),
);
const EventLocalitiesPage = lazy(() =>
  import("./pages/EventLocalitiesPage").then((m) => ({ default: m.EventLocalitiesPage })),
);
const EventsListPage = lazy(() =>
  import("./pages/EventsListPage").then((m) => ({ default: m.EventsListPage })),
);
const LocalityDetailPage = lazy(() =>
  import("./pages/LocalityDetailPage").then((m) => ({ default: m.LocalityDetailPage })),
);
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-text-muted">Cargando...</div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <EventsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/eventos/:eventId"
              element={
                <ProtectedRoute>
                  <EventDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/eventos/:eventId/localidades"
              element={
                <ProtectedRoute>
                  <EventLocalitiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/eventos/:eventId/localidades/:localityId"
              element={
                <ProtectedRoute>
                  <LocalityDetailPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
