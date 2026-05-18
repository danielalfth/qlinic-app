import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import PatientSchedule from './pages/patient/PatientSchedule';
import PatientQueue from './pages/patient/PatientQueue';
import PatientMedicalRecords from './pages/patient/PatientMedicalRecords';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import DoctorPatientList from './pages/doctor/DoctorPatientList';
import DoctorMedicalRecords from './pages/doctor/DoctorMedicalRecords';
import AdminSchedule from './pages/admin/AdminSchedule';
import AdminQueueManagement from './pages/admin/AdminQueueManagement';
import AdminMedicalRecords from './pages/admin/AdminMedicalRecords';
import DashboardLayout from './components/Layout/DashboardLayout';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultRoutes = { pasien: '/patient/schedule', dokter: '/doctor/patients', admin: '/admin/queue' };
    return <Navigate to={defaultRoutes[user.role] || '/login'} replace />;
  }
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const getDefaultRoute = () => {
    if (!user) return '/login';
    const routes = { pasien: '/patient/schedule', dokter: '/doctor/patients', admin: '/admin/queue' };
    return routes[user.role] || '/login';
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={getDefaultRoute()} replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to={getDefaultRoute()} replace /> : <SignUpPage />} />

      {/* Patient Routes */}
      <Route path="/patient" element={<ProtectedRoute allowedRoles={['pasien']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="schedule" element={<PatientSchedule />} />
        <Route path="queue" element={<PatientQueue />} />
        <Route path="medical-records" element={<PatientMedicalRecords />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Doctor Routes */}
      <Route path="/doctor" element={<ProtectedRoute allowedRoles={['dokter']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="schedule" element={<DoctorSchedule />} />
        <Route path="patients" element={<DoctorPatientList />} />
        <Route path="medical-records" element={<DoctorMedicalRecords />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="schedule" element={<AdminSchedule />} />
        <Route path="queue" element={<AdminQueueManagement />} />
        <Route path="medical-records" element={<AdminMedicalRecords />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
