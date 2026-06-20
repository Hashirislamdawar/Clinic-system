import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import Skeleton from "./components/ui/Skeleton.jsx";
import { useAuth } from "./context/AuthContext.jsx";

// Code-splitting: each page is its own chunk, loaded on demand.
const Login = lazy(() => import("./pages/Login.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Patients = lazy(() => import("./pages/Patients.jsx"));
const PatientProfile = lazy(() => import("./pages/PatientProfile.jsx"));
const Doctors = lazy(() => import("./pages/Doctors.jsx"));
const DoctorProfile = lazy(() => import("./pages/DoctorProfile.jsx"));
const Appointments = lazy(() => import("./pages/Appointments.jsx"));
const Audit = lazy(() => import("./pages/Audit.jsx"));

function PageFallback() {
  return (
    <div>
      <Skeleton width={220} height={30} style={{ marginBottom: 22 }} />
      <div className="kpi-grid mb-24">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={120} radius={16} />
        ))}
      </div>
      <Skeleton height={320} radius={16} />
    </div>
  );
}

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <Skeleton width={120} height={20} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

const page = (El) => (
  <Suspense fallback={<PageFallback />}>
    <El />
  </Suspense>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={page(Login)} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={page(Dashboard)} />
          <Route path="/patients" element={page(Patients)} />
          <Route path="/patients/:id" element={page(PatientProfile)} />
          <Route path="/doctors" element={page(Doctors)} />
          <Route path="/doctors/:id" element={page(DoctorProfile)} />
          <Route path="/appointments" element={page(Appointments)} />
          <Route path="/audit" element={page(Audit)} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
