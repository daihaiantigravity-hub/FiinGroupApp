import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { type ReactNode, useState } from 'react';
import LoginPage from '../features/auth/LoginPage';
import { useAuth } from '../features/auth/AuthProvider';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import ProfilePage from '../features/auth/ProfilePage';
import DashboardPage from '../features/dashboard/DashboardPage';
import TfsProjectsPage from '../features/dashboard/TfsProjectsPage';
import KnowledgePage from '../features/content/KnowledgePage';

function Home() {
  return <Navigate to="/dashboard" replace />;
}

function NavigationLink({ to, children, icon }: { to: string; children: string; icon: ReactNode }) {
  return <NavLink className={({ isActive }) => 'app-nav-link' + (isActive ? ' active' : '')} to={to}>
    <span className="app-nav-icon" aria-hidden="true">{icon}</span>
    <span>{children}</span>
  </NavLink>;
}

const dashboardIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
const projectManagementIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
const projectTasksIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const profileIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>;
const wikiIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
const announcementsIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 3L9 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2l2 7h2l-2-7h2l12 6V3z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>;

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
        <NavigationLink to="/dashboard" icon={dashboardIcon}>Dashboard</NavigationLink>
        <div className="app-nav-group-label">Dự án</div>
        <NavigationLink to="/projectmanagement" icon={projectManagementIcon}>Quản lý dự án</NavigationLink>
        <NavigationLink to="/project-tasks" icon={projectTasksIcon}>Tiến độ dự án</NavigationLink>
        <NavigationLink to="/wiki" icon={wikiIcon}>Wiki nội bộ</NavigationLink>
        <NavigationLink to="/announcements" icon={announcementsIcon}>Thông báo &amp; Tài liệu</NavigationLink>
        <div className="app-nav-group-label">Tài khoản</div>
        <NavigationLink to="/profile" icon={profileIcon}>Thông tin cá nhân</NavigationLink>
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
        <Route path="/wiki" element={<ProtectedRoute><KnowledgePage kind="wiki" /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><KnowledgePage kind="announcements" /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      </Routes></main>
    </div>
  </div>;
}
