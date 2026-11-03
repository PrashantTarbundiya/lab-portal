import { Routes, Route, Navigate } from 'react-router-dom';

// Patient Pages
import PatientLogin from './pages/patient/PatientLogin';
import OTPVerify from './pages/patient/OTPVerify';
import Consent from './pages/patient/Consent';
import ProfilePicker from './pages/patient/ProfilePicker';
import ReportList from './pages/patient/ReportList';
import ReportDetail from './pages/patient/ReportDetail';
import LinkLanding from './pages/patient/LinkLanding';
import PrivacyPage from './pages/patient/PrivacyPage';

// Staff Pages
import StaffLogin from './pages/staff/StaffLogin';
import StaffConsole from './pages/staff/StaffConsole';
import StaffOrderDetail from './pages/staff/StaffOrderDetail';
import ImportPage from './pages/staff/ImportPage';
import TasksPage from './pages/staff/TasksPage';
import AccessLogPage from './pages/staff/AccessLogPage';
import OperationsReport from './pages/staff/OperationsReport';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';

export default function App() {
  return (
    <Routes>
      {/* ─── Patient Flows ─── */}
      <Route path="/" element={<PatientLogin />} />
      <Route path="/otp" element={<OTPVerify />} />
      <Route path="/consent" element={<Consent />} />
      <Route path="/profiles" element={<ProfilePicker />} />
      <Route path="/reports" element={<ReportList />} />
      <Route path="/reports/:id" element={<ReportDetail />} />
      <Route path="/r/:token" element={<LinkLanding />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* ─── Staff Flows ─── */}
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route path="/staff" element={<StaffConsole />} />
      <Route path="/staff/orders/:id" element={<StaffOrderDetail />} />
      <Route path="/staff/import" element={<ImportPage />} />
      <Route path="/staff/tasks" element={<TasksPage />} />
      <Route path="/staff/access-log" element={<AccessLogPage />} />
      <Route path="/staff/operations" element={<OperationsReport />} />

      {/* ─── Doctor Flows ─── */}
      <Route path="/doctor/login" element={<StaffLogin />} />
      <Route path="/doctor" element={<DoctorDashboard />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

