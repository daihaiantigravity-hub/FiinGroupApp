import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from '../features/auth/LoginPage';
import { useAuth } from '../features/auth/AuthProvider';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import ProfilePage from '../features/auth/ProfilePage';
import DashboardPage from '../features/dashboard/DashboardPage';
import TfsProjectsPage from '../features/dashboard/TfsProjectsPage';

function Home() {
  return <Navigate to="/dashboard" replace />;
}

function NavigationLink({ to, children, icon }: { to: string; children: string; icon: string }) {
  return <NavLink className={({ isActive }) => 'app-nav-link' + (isActive ? ' active' : '')} to={to}>
    <span className="app-nav-icon" aria-hidden="true">{icon}</span>
    <span>{children}</span>
  </NavLink>;
}

export default function App() {
  const auth = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (auth.status !== 'authenticated') return <main><LoginPage /></main>;

  const displayName = auth.user?.fullName || auth.user?.login || 'User';
  const initials = displayName.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();

  return <div className={'app-shell' + (sidebarOpen ? ' sidebar-open' : '')}>
    <div className="app-mobile-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
    <aside className="app-sidebar">
      <div className="app-brand">
        <div className="app-brand-mark">FG</div>
        <div><strong>FIINGROUP</strong><small>Jarvis Platform</small></div>
        <button className="app-sidebar-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu">×</button>
      </div>
      <div className="app-nav-caption">WORKSPACE</div>
      <nav className="app-nav" aria-label="Điều hướng chính">
        <NavigationLink to="/dashboard" icon="⌂">Dashboard</NavigationLink>
        <div className="app-nav-group-label">Dự án</div>
        <NavigationLink to="/projectmanagement" icon="▣">Quản lý dự án</NavigationLink>
        <NavigationLink to="/project-tasks" icon="◌">Tiến độ dự án</NavigationLink>
        <div className="app-nav-group-label">Tài khoản</div>
        <NavigationLink to="/profile" icon="◎">Thông tin cá nhân</NavigationLink>
      </nav>
      <div className="app-sidebar-footer">
        <div className="app-user-mini"><span className="app-avatar">{initials}</span><div><strong>{displayName}</strong><small>{auth.user?.positionsName || 'Technical pilot'}</small></div></div>
        <button type="button" className="app-signout" onClick={() => void auth.logout()}>Đăng xuất</button>
      </div>
    </aside>
    <div className="app-main-shell">
      <header className="app-topbar">
        <button className="app-menu-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Mở menu">☰</button>
        <div><p className="app-topbar-kicker">FIINGROUP / INTERNAL PLATFORM</p><strong>Không gian làm việc</strong></div>
        <div className="app-topbar-user"><span className="app-avatar">{initials}</span><span>{displayName}</span></div>
      </header>
      <main className="app-content"><Routes>
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><TfsProjectsPage pageKind="browser" /></ProtectedRoute>} />
        <Route path="/projectmanagement" element={<ProtectedRoute><TfsProjectsPage pageKind="management" /></ProtectedRoute>} />
        <Route path="/project-tasks" element={<ProtectedRoute><TfsProjectsPage initialSheet="wbs" pageKind="tasks" /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      </Routes></main>
    </div>
  </div>;
}
