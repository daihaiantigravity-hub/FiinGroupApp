import { Link, Route, Routes } from 'react-router-dom';
import { apiClient } from '../shared/api/apiClient';
import LoginPage from '../features/auth/LoginPage';
import { useAuth } from '../features/auth/AuthProvider';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import ProfilePage from '../features/auth/ProfilePage';

function Home() {
  return <section><h2>Application Platform</h2><p>FiinGroupApp đang được xây dựng theo AI-DLC.</p><button onClick={() => apiClient.get('/health').then(console.log).catch(console.error)}>Kiểm tra API</button></section>;
}

export default function App() {
  const auth = useAuth();
  if (auth.status !== 'authenticated') return <main><LoginPage /></main>;
  return <div className="app-shell"><header><h1>FiinGroupApp</h1><nav><Link to="/">Trang chủ</Link> <Link to="/profile">Tài khoản</Link> <button onClick={auth.logout}>Đăng xuất</button></nav></header><main><Routes><Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} /><Route path="*" element={<ProtectedRoute><Home /></ProtectedRoute>} /></Routes></main></div>;
}
