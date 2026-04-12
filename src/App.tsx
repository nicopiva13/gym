import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import React from 'react';
import Toast from './components/Toast';

// Auth Pages
import AdminLogin from './pages/auth/LoginAdmin';
import TrainerLogin from './pages/auth/LoginTrainer';
import ClientLogin from './pages/auth/LoginClient';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import TrainerLayout from './layouts/TrainerLayout';
import ClientLayout from './layouts/ClientLayout';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import TrainerManagement from './pages/admin/TrainerManagement';
import ClientManagement from './pages/admin/ClientManagement';
import MembershipPlans from './pages/admin/MembershipPlans';
import PaymentsCaja from './pages/admin/PaymentsCaja';
import GymSettings from './pages/admin/GymSettings';
import Complaints from './pages/admin/Complaints';
import AdminStats from './pages/admin/AdminStats';

// Trainer Pages
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import MyClients from './pages/trainer/MyClients';
import ClientDetail from './pages/trainer/ClientDetail';
import ExerciseLibrary from './pages/trainer/ExerciseLibrary';
import TrainingPlans from './pages/trainer/TrainingPlans';
import PlanBuilder from './pages/trainer/PlanBuilder';
import TrainerPayments from './pages/trainer/TrainerPayments';

// Client Page
import ClientDashboard from './pages/client/ClientDashboard';

function PrivateRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole: 'owner' | 'trainer' | 'client' }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#09090b] flex justify-center items-center text-amber-500 font-display text-4xl tracking-widest animate-pulse">IRON GYM</div>;
  }

  if (!user || user.role !== allowedRole) {
    const loginPath = allowedRole === 'owner' ? '/admin/login' : (allowedRole === 'trainer' ? '/trainer/login' : '/usuario/login');
    return <Navigate to={loginPath} replace />;
  }

  if (user.role === 'owner') return <AdminLayout>{children}</AdminLayout>;
  if (user.role === 'trainer') return <TrainerLayout>{children}</TrainerLayout>;
  return <ClientLayout>{children}</ClientLayout>;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toast />
        <Routes>
          {/* LOGIN ROUTES */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/trainer/login" element={<TrainerLogin />} />
          <Route path="/usuario/login" element={<ClientLogin />} />

          {/* ADMIN PORTAL */}
          <Route path="/admin" element={<PrivateRoute allowedRole="owner"><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/trainers" element={<PrivateRoute allowedRole="owner"><TrainerManagement /></PrivateRoute>} />
          <Route path="/admin/clients" element={<PrivateRoute allowedRole="owner"><ClientManagement /></PrivateRoute>} />
          <Route path="/admin/plans" element={<PrivateRoute allowedRole="owner"><MembershipPlans /></PrivateRoute>} />
          <Route path="/admin/payments" element={<PrivateRoute allowedRole="owner"><PaymentsCaja /></PrivateRoute>} />
          <Route path="/admin/settings" element={<PrivateRoute allowedRole="owner"><GymSettings /></PrivateRoute>} />
          <Route path="/admin/complaints" element={<PrivateRoute allowedRole="owner"><Complaints /></PrivateRoute>} />
          <Route path="/admin/estadisticas" element={<PrivateRoute allowedRole="owner"><AdminStats /></PrivateRoute>} />

          {/* TRAINER PORTAL */}
          <Route path="/entrenador" element={<PrivateRoute allowedRole="trainer"><TrainerDashboard /></PrivateRoute>} />
          <Route path="/entrenador/clientes" element={<PrivateRoute allowedRole="trainer"><MyClients /></PrivateRoute>} />
          <Route path="/entrenador/clientes/:id" element={<PrivateRoute allowedRole="trainer"><ClientDetail /></PrivateRoute>} />
          <Route path="/entrenador/ejercicios" element={<PrivateRoute allowedRole="trainer"><ExerciseLibrary /></PrivateRoute>} />
          <Route path="/entrenador/planes" element={<PrivateRoute allowedRole="trainer"><TrainingPlans /></PrivateRoute>} />
          <Route path="/entrenador/planes/crear" element={<PrivateRoute allowedRole="trainer"><PlanBuilder /></PrivateRoute>} />
          <Route path="/entrenador/planes/:id/editar" element={<PrivateRoute allowedRole="trainer"><PlanBuilder /></PrivateRoute>} />
          <Route path="/entrenador/caja" element={<PrivateRoute allowedRole="trainer"><TrainerPayments /></PrivateRoute>} />

          {/* CLIENT PORTAL */}
          <Route path="/usuario" element={<PrivateRoute allowedRole="client"><ClientDashboard /></PrivateRoute>} />

          {/* REDIRECTS */}
          <Route path="/" element={<Navigate to="/usuario/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
