import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { EventDashboardPage } from "./pages/EventDashboardPage";
import { EventLocalitiesPage } from "./pages/EventLocalitiesPage";
import { EventsListPage } from "./pages/EventsListPage";
import { LocalityDetailPage } from "./pages/LocalityDetailPage";
import { LoginPage } from "./pages/LoginPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
