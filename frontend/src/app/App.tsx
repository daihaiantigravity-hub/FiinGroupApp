import { NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { type MouseEvent as ReactMouseEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import LoginPage from '../features/auth/LoginPage';
import { useAuth } from '../features/auth/AuthProvider';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import ProfilePage from '../features/auth/ProfilePage';
import DashboardPage from '../features/dashboard/DashboardPage';
import TfsProjectsPage from '../features/dashboard/TfsProjectsPage';
import KnowledgePage from '../features/content/KnowledgePage';
import DocumentsPage from '../features/content/DocumentsPage';

function Home() { return <Navigate to="/dashboard" replace />; }

const dashboardIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
const peopleIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const requestIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6M10 22h4" /></svg>;
const projectIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>;
const accountingIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><rect width="16" height="20" x="4" y="2" rx="2" /><path d="M8 6h8M16 14v4M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" /></svg>;
const documentsIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8M16 17H8M10 9H8" /></svg>;
const trainingIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>;
const reportsIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" /></svg>;
const settingsIcon = <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;

type SourceEntry = { label: string; to?: string };
type SourceGroupProps = { label: string; icon: ReactNode; entries: SourceEntry[]; expanded: boolean; onToggle: () => void };

function SourceGroup({ label, icon, entries, expanded, onToggle }: SourceGroupProps) {
  const location = useLocation();
  const active = entries.some(entry => entry.to === location.pathname);
  return <section className={'app-source-group' + (expanded ? ' expanded' : '') + (active ? ' active' : '')}>
    <button type="button" className="app-source-group-trigger" onClick={onToggle} aria-expanded={expanded}><span className="app-source-icon">{icon}</span><span className="app-source-label">{label}</span><span className="app-source-chevron">›</span></button>
    <div className="app-source-submenu">{entries.map(entry => entry.to ? <NavLink key={entry.label} to={entry.to} className={({ isActive }) => 'app-source-subitem' + (isActive ? ' active' : '')}>{entry.label}</NavLink> : <span key={entry.label} className="app-source-subitem disabled" title="Chưa chuyển đổi trong FiinGroupApp">{entry.label}</span>)}</div>
  </section>;
}

function AppTab({ to, label, close, onClose, onContextMenu, draggable, onDragStart, onDragOver, onDrop, onDragEnd, onMiddleClick }: { to: string; label: string; close?: boolean; onClose?: () => void; onContextMenu?: (event: ReactMouseEvent<HTMLDivElement>) => void; draggable?: boolean; onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void; onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void; onDrop?: (event: React.DragEvent<HTMLDivElement>) => void; onDragEnd?: () => void; onMiddleClick?: () => void }) {
  const location = useLocation();
  const active = location.pathname === to;
  return <div className={'app-tab' + (active ? ' active' : '')} role="presentation" draggable={draggable} onContextMenu={onContextMenu} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd} onMouseDown={event => { if (event.button === 1) { event.preventDefault(); onMiddleClick?.(); } }}>
    <NavLink to={to} className="app-tab-link" aria-current={active ? 'page' : undefined}><span>{label}</span></NavLink>
    {close && <button type="button" className="app-tab-close" onClick={onClose} aria-label={`Đóng ${label}`}>×</button>}
  </div>;
}

const tabLabels: Record<string, string> = {
  '/dashboard': '⌂ Dashboard',
  '/projectmanagement': 'Quản lý dự án',
  '/project-tasks': 'Tiến độ dự án',
  '/wiki': 'Wiki nội bộ',
  '/announcements': 'Thông báo & Tài liệu',
  '/documents': 'Tài liệu',
  '/profile': 'Thông tin cá nhân',
};

function TargetPage({ path }: { path: string }) {
  switch (path) {
    case '/dashboard': return <ProtectedRoute><DashboardPage /></ProtectedRoute>;
    case '/projectmanagement': return <ProtectedRoute><TfsProjectsPage pageKind="management" /></ProtectedRoute>;
    case '/project-tasks': return <ProtectedRoute><TfsProjectsPage initialSheet="wbs" pageKind="tasks" /></ProtectedRoute>;
    case '/wiki': return <ProtectedRoute><KnowledgePage kind="wiki" /></ProtectedRoute>;
    case '/announcements': return <ProtectedRoute><KnowledgePage kind="announcements" /></ProtectedRoute>;
    case '/documents': return <ProtectedRoute><DocumentsPage /></ProtectedRoute>;
    case '/profile': return <ProtectedRoute><ProfilePage /></ProtectedRoute>;
    default: return <Navigate to="/dashboard" replace />;
  }
}

export default function App() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.localStorage.getItem('sidebarCollapsed') === 'true');
  const [expandedGroup, setExpandedGroup] = useState('Dự án');
  const tabStorageKey = `jarvis_open_tabs_${auth.user?.id || auth.user?.login || 'anonymous'}`;
  const activeTabStorageKey = `jarvis_active_tab_${auth.user?.id || auth.user?.login || 'anonymous'}`;
  const [openTabs, setOpenTabs] = useState<string[]>(['/dashboard']);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [tabScroll, setTabScroll] = useState({ left: false, right: false });
  const [tabContext, setTabContext] = useState<{ path: string; x: number; y: number } | null>(null);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);

  const toggleSidebar = () => setSidebarCollapsed(current => { const next = !current; window.localStorage.setItem('sidebarCollapsed', String(next)); return next; });
  const toggleGroup = (label: string) => setExpandedGroup(current => current === label ? '' : label);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(tabStorageKey) || '[]');
      if (Array.isArray(saved)) {
        const valid = saved.filter((path): path is string => typeof path === 'string' && Boolean(tabLabels[path]));
        setOpenTabs(Array.from(new Set(['/dashboard', ...valid])));
      }
    } catch {
      setOpenTabs(['/dashboard']);
    }
  }, [tabStorageKey]);

  useEffect(() => {
    const path = tabLabels[location.pathname] ? location.pathname : '/dashboard';
    setOpenTabs(current => {
      if (current.includes(path)) return current;
      const next = [...current, path];
      window.localStorage.setItem(tabStorageKey, JSON.stringify(next));
      return next;
    });
    if (tabLabels[location.pathname]) window.localStorage.setItem(activeTabStorageKey, location.pathname);
  }, [activeTabStorageKey, location.pathname, tabStorageKey]);

  useEffect(() => {
    const node = tabBarRef.current;
    if (!node) return;

    const updateTabScroll = () => {
      const maxScrollLeft = Math.max(0, node.scrollWidth - node.clientWidth);
      setTabScroll({
        left: node.scrollLeft > 1,
        right: node.scrollLeft < maxScrollLeft - 1,
      });
    };

    updateTabScroll();
    node.addEventListener('scroll', updateTabScroll, { passive: true });
    window.addEventListener('resize', updateTabScroll);
    return () => {
      node.removeEventListener('scroll', updateTabScroll);
      window.removeEventListener('resize', updateTabScroll);
    };
  }, [openTabs]);

  useEffect(() => {
    if (!tabContext) return;
    const closeContextMenu = () => setTabContext(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeContextMenu();
    };
    document.addEventListener('mousedown', closeContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', closeContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tabContext]);

  const scrollTabs = (amount: number) => tabBarRef.current?.scrollBy({ left: amount, behavior: 'smooth' });

  const persistOpenTabs = (tabs: string[]) => window.localStorage.setItem(tabStorageKey, JSON.stringify(tabs));

  const closeTabSet = (paths: string[]) => {
    const pathsToClose = new Set(paths.filter(path => path !== '/dashboard'));
    if (pathsToClose.size === 0) return;
    setOpenTabs(current => {
      const next = current.filter(path => !pathsToClose.has(path));
      persistOpenTabs(next);
      if (pathsToClose.has(location.pathname)) {
        const currentIndex = current.indexOf(location.pathname);
        navigate(next[Math.min(Math.max(currentIndex, 0), next.length - 1)] || '/dashboard');
      }
      return next;
    });
  };

  const closeTab = (path: string) => {
    closeTabSet([path]);
  };

  const reorderTab = (targetPath: string) => {
    if (!draggedTab || draggedTab === targetPath || draggedTab === '/dashboard' || targetPath === '/dashboard') return;
    setOpenTabs(current => {
      const fromIndex = current.indexOf(draggedTab);
      const targetIndex = current.indexOf(targetPath);
      if (fromIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(next.indexOf(targetPath), 0, moved);
      persistOpenTabs(next);
      return next;
    });
  };

  const openTabContextMenu = (path: string, event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setTabContext({ path, x: event.clientX, y: event.clientY });
  };

  const runTabContextAction = (action: 'close' | 'close-left' | 'close-right' | 'close-others' | 'close-all') => {
    if (!tabContext) return;
    const index = openTabs.indexOf(tabContext.path);
    if (index < 0) return setTabContext(null);
    if (action === 'close') closeTabSet([tabContext.path]);
    if (action === 'close-left') closeTabSet(openTabs.slice(0, index));
    if (action === 'close-right') closeTabSet(openTabs.slice(index + 1));
    if (action === 'close-others') closeTabSet(openTabs.filter(path => path !== tabContext.path));
    if (action === 'close-all') closeTabSet(openTabs.filter(path => path !== '/dashboard'));
    setTabContext(null);
  };

  if (auth.status !== 'authenticated') return <main><LoginPage /></main>;
  if (!tabLabels[location.pathname]) {
    const savedActive = window.localStorage.getItem(activeTabStorageKey);
    return <Navigate to={location.pathname === '/' && savedActive && tabLabels[savedActive] ? savedActive : '/dashboard'} replace />;
  }

  const displayName = auth.user?.fullName || auth.user?.login || 'User';
  const initials = displayName.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();

  const projectEntries: SourceEntry[] = [
    { label: 'Dashboard CEO' }, { label: 'Khách hàng' }, { label: 'Phụ lục/Hợp đồng' }, { label: 'Phân bổ CPBH' },
    { label: 'Quản lý dự án', to: '/projectmanagement' }, { label: 'Tiến độ dự án', to: '/project-tasks' }, { label: 'Tổng hợp dự án' },
    { label: 'PDCA & Đề xuất' }, { label: 'Chi phí dự án' }, { label: 'Danh sách Task Plan' }, { label: 'KPI Doanh thu' },
  ];

  return <div className={'app-shell' + (sidebarOpen ? ' sidebar-open' : '') + (sidebarCollapsed ? ' sidebar-collapsed' : '')}>
    <div className="app-mobile-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
    <aside className="app-sidebar">
      <div className="app-brand"><NavLink to="/dashboard" className="app-brand-link" title="Dashboard"><span className="app-brand-mark"><img src="/assets/images/favicon.svg" alt="Goline Logo" /></span><span className="app-brand-text">JARVIS</span></NavLink><button className="app-sidebar-toggle" type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={sidebarCollapsed ? 'M13 5l7 7-7 7M6 5l7 7-7 7' : 'M11 19l-7-7 7-7M18 19l-7-7 7-7'} /></svg></button><button className="app-sidebar-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu">×</button></div>
      <nav className="app-source-nav" aria-label="Điều hướng chính">
        <SourceGroup label="Nhân sự" icon={peopleIcon} entries={[{ label: 'Sơ đồ tổ chức' }, { label: 'Thông tin cá nhân', to: '/profile' }, { label: 'Hồ sơ nhân sự' }, { label: 'Onboard / Offboard' }, { label: 'Bản đồ năng lực' }, { label: 'Đánh giá nhân sự' }, { label: 'Đánh giá chất lượng' }, { label: 'Tuyển dụng' }]} expanded={expandedGroup === 'Nhân sự'} onToggle={() => toggleGroup('Nhân sự')} />
        <SourceGroup label="Đề xuất" icon={requestIcon} entries={[{ label: 'Việc chờ tôi duyệt' }, { label: 'Đề xuất hành chính' }, { label: 'Xin nghỉ phép / Đi muộn/ Về sớm' }, { label: 'Ứng trước lương' }]} expanded={expandedGroup === 'Đề xuất'} onToggle={() => toggleGroup('Đề xuất')} />
        <SourceGroup label="Dự án" icon={projectIcon} entries={projectEntries} expanded={expandedGroup === 'Dự án'} onToggle={() => toggleGroup('Dự án')} />
        <SourceGroup label="Kế toán" icon={accountingIcon} entries={[{ label: 'Lương thưởng' }, { label: 'Lương hợp đồng' }, { label: 'Bảo hiểm' }, { label: 'Giao dịch tiền' }, { label: 'Phân bổ chi phí' }, { label: 'Dự thu' }, { label: 'Dự chi' }, { label: 'Hợp đồng mua sắm' }, { label: 'Nhà cung cấp' }, { label: 'Tài sản' }]} expanded={expandedGroup === 'Kế toán'} onToggle={() => toggleGroup('Kế toán')} />
        <SourceGroup label="Tài liệu" icon={documentsIcon} entries={[{ label: 'Wiki nội bộ', to: '/wiki' }, { label: 'Thông báo & Tài liệu', to: '/announcements' }, { label: 'Chatbot' }, { label: 'Cài đặt Email' }, { label: 'Quản lý tiến trình Job' }]} expanded={expandedGroup === 'Tài liệu'} onToggle={() => toggleGroup('Tài liệu')} />
        <SourceGroup label="Đào tạo" icon={trainingIcon} entries={[{ label: 'Bài giảng & Câu hỏi' }, { label: 'Đợt thi' }, { label: 'Tổng hợp kết quả' }, { label: 'Làm bài thi' }]} expanded={expandedGroup === 'Đào tạo'} onToggle={() => toggleGroup('Đào tạo')} />
        <SourceGroup label="Báo cáo" icon={reportsIcon} entries={[{ label: 'Báo cáo' }, { label: 'Nhật ký Server' }, { label: 'Nhật ký vào ra' }, { label: 'Quản lý cuộc họp' }]} expanded={expandedGroup === 'Báo cáo'} onToggle={() => toggleGroup('Báo cáo')} />
        <SourceGroup label="Thiết lập" icon={settingsIcon} entries={[{ label: 'Thuộc tính User' }, { label: 'Danh sách sản phẩm' }, { label: 'Tham số' }, { label: 'Phân quyền' }, { label: 'Quy trình duyệt' }]} expanded={expandedGroup === 'Thiết lập'} onToggle={() => toggleGroup('Thiết lập')} />
      </nav>
      <div className="app-sidebar-footer"><NavLink className="app-user-mini app-user-profile-link" to="/profile" title="Thông tin cá nhân"><span className="app-avatar">{initials}</span><span className="app-user-details"><strong>{displayName}</strong><small>{auth.user?.positionsName || 'v26050301'}</small></span></NavLink><button type="button" className="app-signout" onClick={() => void auth.logout()} title="Đăng xuất"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg></button></div>
    </aside>
    <div className="app-main-shell">
      <header className="app-topbar"><button className="app-menu-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Mở menu">☰</button><div className="app-tab-strip"><button type="button" className="app-tab-scroll" onClick={() => scrollTabs(-180)} disabled={!tabScroll.left} aria-label="Cuộn tab sang trái">‹</button><div ref={tabBarRef} className="app-tab-bar" role="tablist" aria-label="Các màn hình đang mở">{openTabs.map(path => <AppTab key={path} to={path} label={tabLabels[path]} close={path !== '/dashboard'} draggable={path !== '/dashboard'} onClose={() => closeTab(path)} onContextMenu={event => openTabContextMenu(path, event)} onMiddleClick={() => closeTab(path)} onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', path); setDraggedTab(path); }} onDragOver={event => { if (draggedTab && draggedTab !== path && path !== '/dashboard') { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }} onDrop={event => { event.preventDefault(); reorderTab(path); setDraggedTab(null); }} onDragEnd={() => setDraggedTab(null)} />)}</div><button type="button" className="app-tab-scroll" onClick={() => scrollTabs(180)} disabled={!tabScroll.right} aria-label="Cuộn tab sang phải">›</button></div><div className="app-topbar-actions"><div className="app-global-search"><input aria-label="Tìm kiếm" placeholder="Tìm kiếm" disabled /><span>⌕</span></div><button type="button" className="app-topbar-icon" disabled aria-label="Thông báo">●</button><button type="button" className="app-topbar-icon" disabled aria-label="Cài đặt">⚙</button></div></header>
      {tabContext && <div className="app-tab-context-menu" style={{ left: tabContext.x, top: tabContext.y }} role="menu" onMouseDown={event => event.stopPropagation()}>
        <button type="button" role="menuitem" onClick={() => runTabContextAction('close')} disabled={tabContext.path === '/dashboard'}>Đóng tab</button>
        <button type="button" role="menuitem" onClick={() => runTabContextAction('close-left')} disabled={!openTabs.slice(0, openTabs.indexOf(tabContext.path)).some(path => path !== '/dashboard')}>Đóng tab bên trái</button>
        <button type="button" role="menuitem" onClick={() => runTabContextAction('close-right')} disabled={!openTabs.slice(openTabs.indexOf(tabContext.path) + 1).length}>Đóng tab bên phải</button>
        <button type="button" role="menuitem" onClick={() => runTabContextAction('close-others')} disabled={openTabs.filter(path => path !== tabContext.path && path !== '/dashboard').length === 0}>Đóng tab khác</button>
        <button type="button" role="menuitem" onClick={() => runTabContextAction('close-all')} disabled={openTabs.length <= 1}>Đóng tất cả</button>
      </div>}
      <main className="app-content"><div className="app-page-stack">{Array.from(new Set([...openTabs, location.pathname])).filter(path => Boolean(tabLabels[path])).map(path => <div key={path} className="app-page-cache" hidden={location.pathname !== path} aria-hidden={location.pathname !== path}><TargetPage path={path} /></div>)}</div></main>
    </div>
  </div>;
}
