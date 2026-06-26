import React, { useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';

// ==========================================
// 1. استيراد الـ Layouts المعزولة
// ==========================================
import { AdminLayout } from './components/layouts/AdminLayout';
import { DoctorLayout } from './components/layouts/DoctorLayout';
import { SecretaryLayout } from './components/layouts/SecretaryLayout';

// ==========================================
// 2. استيراد الصفحات
// ==========================================
// -- صفحات المدير --
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TeamManagement } from './pages/admin/TeamManagement';
import { AdminReports } from './pages/admin/AdminReports';
import { SystemSettings } from './pages/admin/SystemSettings';

// -- صفحات الدكتور --
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { Appointments } from './pages/doctor/Appointments';
import { Patients } from './pages/doctor/Patients';
import { DoctorReports } from './pages/doctor/DoctorReports';
import { Sessions } from './pages/doctor/Sessions';
import { DoctorProfile } from './pages/doctor/DoctorProfile';
import { TreatmentDashboard } from './pages/doctor/TreatmentDashboard'; 
import { DoctorChat } from './pages/doctor/DoctorChat'; 

// -- 🌟 صفحات السكرتير (الجديدة كاملة) --
import { SecretaryReservations } from './pages/secretary/SecretaryReservations'; 
import { SecretaryDailySessions } from './pages/secretary/SecretaryDailySessions'; 
import { SecretaryPatients } from './pages/secretary/SecretaryPatients'; 
import { SecretaryChat } from './pages/secretary/SecretaryChat'; 

// -- صفحات الدخول --
import AdminLogin from './pages/auth/AdminLogin';
import StaffLogin from './pages/auth/StaffLogin';
import CreateAccount from './pages/auth/CreateAccount';
import RootAdminSetup from './pages/auth/RootAdminSetup';
import { supabase } from './services/supabase';

// ==========================================
// 🛡️ حارس الأمن الصارم (ProtectedRoute)
// ==========================================
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00838F]"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/staff-login" replace />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* بوابات الدخول */}
          <Route path="/" element={<Navigate to="/staff-login" replace />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/staff-login" element={<StaffLogin />} />
          <Route path="/etizan-secret-root-setup-2026" element={<RootAdminSetup />} />

          {/* ========================================== */}
          {/* 👑 مملكة الإدارة */}
          {/* ========================================== */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="create-account" element={<CreateAccount />} />
          </Route>

          {/* ========================================== */}
          {/* 🩺 مملكة الأطباء */}
          {/* ========================================== */}
          <Route path="/doctor" element={<ProtectedRoute><DoctorLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="appointments" element={<Appointments />} /> 
            <Route path="patients" element={<Patients />} />
            <Route path="reports" element={<DoctorReports />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="treatment-plan" element={<TreatmentDashboard />} /> 
            <Route path="chat" element={<DoctorChat />} /> 
            <Route path="profile" element={<DoctorProfile />} />
          </Route>

          {/* ========================================== */}
          {/* 📋 مملكة السكرتارية 🌟 */}
          {/* ========================================== */}
          <Route path="/secretary" element={<ProtectedRoute><SecretaryLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="reservations" replace />} />
            <Route path="reservations" element={<SecretaryReservations />} />
            <Route path="sessions" element={<SecretaryDailySessions />} />
            <Route path="patients" element={<SecretaryPatients />} />
            <Route path="messages" element={<SecretaryChat />} />
          </Route>

          {/* أي مسار غلط بيرمي على الدخول */}
          <Route path="*" element={<Navigate to="/staff-login" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;