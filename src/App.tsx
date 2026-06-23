import React, { useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';

// استيراد الـ Layouts المعزولة
import { AdminLayout } from './components/layouts/AdminLayout';
import { DoctorLayout } from './components/layouts/DoctorLayout';

// استيراد صفحات المدير
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TeamManagement } from './pages/admin/TeamManagement';
import { AdminReports } from './pages/admin/AdminReports';
import { SystemSettings } from './pages/admin/SystemSettings';

// استيراد صفحات الدكتور
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { Appointments } from './pages/doctor/Appointments';
import { Patients } from './pages/doctor/Patients';
import { DoctorReports } from './pages/doctor/DoctorReports';
import { Sessions } from './pages/doctor/Sessions';
import { DoctorProfile } from './pages/doctor/DoctorProfile';
import { TreatmentDashboard } from './pages/doctor/TreatmentDashboard'; // 🌟 استيراد لوحة الخطط العلاجية الجديدة
import { DoctorChat } from './pages/doctor/DoctorChat'; // 🌟 استيراد لوحة الخطط العلاجية الجديدة

// استيراد صفحات الدخول
import AdminLogin from './pages/auth/AdminLogin';
import StaffLogin from './pages/auth/StaffLogin';
import CreateAccount from './pages/auth/CreateAccount';
import RootAdminSetup from './pages/auth/RootAdminSetup';
import { supabase } from './services/supabase';

// 🛡️ حارس الأمن الصارم
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
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
          {/* 👑 مملكة الإدارة (كل مساراتها بتبدأ بـ /admin) */}
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
          {/* 🩺 مملكة الأطباء (كل مساراتها بتبدأ بـ /doctor) */}
          {/* ========================================== */}
          <Route path="/doctor" element={<ProtectedRoute><DoctorLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="appointments" element={<Appointments />} /> 
            <Route path="patients" element={<Patients />} />
            <Route path="reports" element={<DoctorReports />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="treatment-plan" element={<TreatmentDashboard />} /> {/* 🌟 مسار لوحة التحكم في الخطط العلاجية */}
            <Route path="chat" element={<DoctorChat />} /> {/* 🌟 مسار لوحة التحكم في الخطط العلاجية */}
            <Route path="profile" element={<DoctorProfile />} />
          </Route>

          {/* أي مسار غلط بيرمي على الدخول */}
          <Route path="*" element={<Navigate to="/staff-login" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;