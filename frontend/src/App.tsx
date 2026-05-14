import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { getToken } from "@/lib/auth";
import { BookingHistoryPage } from "@/pages/BookingHistoryPage";
import { CourtDetailPage } from "@/pages/CourtDetailPage";
import { CreateBookingPage } from "@/pages/CreateBookingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { RegisterPage } from "@/pages/RegisterPage";

function ProtectedRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestRoute() {
  return getToken() ? <Navigate to="/" replace /> : <Outlet />;
}

export function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<BookingHistoryPage />} />
        <Route path="/bookings/new" element={<CreateBookingPage />} />
        <Route path="/courts/:courtId" element={<CourtDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to={getToken() ? "/" : "/login"} replace />} />
    </Routes>
  );
}
