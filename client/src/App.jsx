import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Universal Top Main Navigation Bar
import TopMainNavbar from './components/TopMainNavbar';
import FloatingAICopilot from './components/FloatingAICopilot';

// Patient Pages
import PatientLogin from './pages/patient/PatientLogin';
import OTPVerify from './pages/patient/OTPVerify';
import Consent from './pages/patient/Consent';
import ProfilePicker from './pages/patient/ProfilePicker';
import ReportList from './pages/patient/ReportList';
import ReportDetail from './pages/patient/ReportDetail';
import LinkLanding from './pages/patient/LinkLanding';
import PrivacyPage from './pages/patient/PrivacyPage';
import HospitalLocatorAndBooking from './pages/patient/HospitalLocatorAndBooking';

// Staff Pages
import StaffLogin from './pages/staff/StaffLogin';
import StaffConsole from './pages/staff/StaffConsole';
import StaffOrderDetail from './pages/staff/StaffOrderDetail';
import ImportPage from './pages/staff/ImportPage';
import TasksPage from './pages/staff/TasksPage';
import AccessLogPage from './pages/staff/AccessLogPage';
import OperationsReport from './pages/staff/OperationsReport';
import LabTasksConsole from './pages/staff/LabTasksConsole';

// Doctor Pages
import DoctorLogin from './pages/doctor/DoctorLogin';
import DoctorDashboard from './pages/doctor/DoctorDashboard';

// Admin Pages
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import HospitalAdminDashboard from './pages/admin/HospitalAdminDashboard';

function GlobalCopilot() {
  const { pathname } = useLocation();
  const hasLocalCopilot =
    pathname.includes('/profiles') ||
    pathname.includes('/reports') ||
    pathname.includes('/doctor');

  if (hasLocalCopilot) return null;
  return <FloatingAICopilot />;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#07151f] text-slate-100 font-sans selection:bg-emerald-400 selection:text-slate-950">
      <TopMainNavbar />
      <div className="flex-1 flex flex-col">
        <Routes>
          {/* ─── Patient Flows (Unique IDs & Canonical Fallbacks) ─── */}
          <Route path="/" element={<PatientLogin />} />
          <Route path="/otp" element={<OTPVerify />} />
          <Route path="/consent" element={<Consent />} />
          <Route path="/patient/:identifier/profiles" element={<ProfilePicker />} />
          <Route path="/profiles" element={<ProfilePicker />} />
          <Route path="/book-appointment" element={<HospitalLocatorAndBooking />} />
          <Route path="/hospitals" element={<HospitalLocatorAndBooking />} />
          <Route path="/patient/:identifier/reports" element={<ReportList />} />
          <Route path="/reports" element={<ReportList />} />
          <Route path="/patient/:identifier/reports/:id" element={<ReportDetail />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route path="/r/:token" element={<LinkLanding />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* ─── Staff Front-Desk Flows (Hierarchical /:hospitalSlug/front-desk & Canonical) ─── */}
          <Route path="/:hospitalSlug/front-desk" element={<StaffConsole />} />
          <Route path="/hospital/:hospitalSlug/front-desk" element={<StaffConsole />} />
          <Route path="/staff" element={<StaffConsole />} />

          {/* ─── Staff Lab Tasks Flows (Hierarchical /:hospitalSlug/lab-tasks & Canonical) ─── */}
          <Route path="/:hospitalSlug/lab-tasks" element={<LabTasksConsole />} />
          <Route path="/hospital/:hospitalSlug/lab-tasks" element={<LabTasksConsole />} />
          <Route path="/staff/lab-tasks" element={<LabTasksConsole />} />
          <Route path="/lab/tasks" element={<LabTasksConsole />} />

          {/* ─── Secondary Staff Tools ─── */}
          <Route path="/staff/orders/:id" element={<StaffOrderDetail />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/staff/import" element={<ImportPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/staff/tasks" element={<TasksPage />} />
          <Route path="/access-logs" element={<AccessLogPage />} />
          <Route path="/access-log" element={<AccessLogPage />} />
          <Route path="/staff/access-log" element={<AccessLogPage />} />
          <Route path="/staff/access-logs" element={<AccessLogPage />} />
          <Route path="/operations-report" element={<OperationsReport />} />
          <Route path="/operations" element={<OperationsReport />} />
          <Route path="/staff/operations" element={<OperationsReport />} />
          <Route path="/staff/reports" element={<OperationsReport />} />

          {/* ─── Doctor Flows (Unique /:hospital-name/:doctor-name & Fallback) ─── */}
          <Route path="/doctor/login" element={<DoctorLogin />} />
          <Route path="/:hospitalSlug/doctor/:doctorSlug" element={<DoctorDashboard />} />
          <Route path="/hospital/:hospitalSlug/doctor/:doctorSlug" element={<DoctorDashboard />} />
          <Route path="/doctor" element={<DoctorDashboard />} />

          {/* ─── Hospital Superintendent / Admin Flows (Unique /:hospital-name/admin) ─── */}
          <Route path="/:hospitalSlug/admin" element={<HospitalAdminDashboard />} />
          <Route path="/hospital/:hospitalSlug/admin" element={<HospitalAdminDashboard />} />
          <Route path="/hospital-admin/:facilityId" element={<HospitalAdminDashboard />} />
          <Route path="/hospital-admin" element={<HospitalAdminDashboard />} />

          {/* ─── Super Admin (Multi-Hospital CMO Network) ─── */}
          <Route path="/admin" element={<SuperAdminDashboard />} />
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/admin/cmo" element={<SuperAdminDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <GlobalCopilot />
    </div>
  );
}

