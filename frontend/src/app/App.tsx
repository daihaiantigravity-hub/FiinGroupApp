import { Link, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage';
import { useAuth } from '../features/auth/AuthProvider';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import ProfilePage from '../features/auth/ProfilePage';
import DashboardPage from '../features/dashboard/DashboardPage';

function Home() {
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const auth = useAuth();
  if (auth.status !== 'authenticated') return <main><LoginPage /></main>;
  return <div className="app-shell"><header><h1>FiinGroupApp</h1><nav><Link to="/dashboard">Dashboard</Link> <Link to="/profile">Tài khoản</Link> <button onClick={auth.logout}>Đăng xuất</button></nav></header><main><Routes><Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} /><Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} /><Route path="*" element={<ProtectedRoute><Home /></ProtectedRoute>} /></Routes></main></div>;
}
