import { createBrowserRouter, Navigate } from 'react-router';
import { useAuth } from './context/AuthContext';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import PrescriptionDetail from './components/PrescriptionDetail';
import Profile from './components/Profile';
import CreateOrder from './components/CreateOrder';
import OrderTracking from './components/OrderTracking';
import Doctors from './components/Doctors';
import Chat from './components/Chat';
import AdminPanel from './components/AdminPanel';

/** Bronze: redirects unauthenticated users to login */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Silver: redirects non-admins back to dashboard */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/',                element: <Landing /> },
  // Public routes — no auth needed
  { path: '/login',           element: <Login /> },
  { path: '/register',        element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  // Protected — any authenticated user
  { path: '/dashboard',       element: <RequireAuth><Dashboard /></RequireAuth> },
  { path: '/prescription/:id',element: <RequireAuth><PrescriptionDetail /></RequireAuth> },
  { path: '/profile',         element: <RequireAuth><Profile /></RequireAuth> },
  { path: '/create-order',    element: <RequireAuth><CreateOrder /></RequireAuth> },
  { path: '/order-tracking',  element: <RequireAuth><OrderTracking /></RequireAuth> },
  { path: '/doctors',         element: <RequireAuth><Doctors /></RequireAuth> },
  { path: '/chat',            element: <RequireAuth><Chat /></RequireAuth> },
  // Admin only — Silver
  { path: '/admin',           element: <RequireAdmin><AdminPanel /></RequireAdmin> },
]);
