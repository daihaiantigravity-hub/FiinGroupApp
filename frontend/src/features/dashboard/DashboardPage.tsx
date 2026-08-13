import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { legacyAuthClient, type LegacyDashboardStats } from '../auth/legacyAuthClient';
import { targetDashboardStats } from '../auth/targetAuthClient';

type ServiceStatus = 'checking' | 'online' | 'offline';

export default function DashboardPage() {
  const auth = useAuth();
  const [apiStatus, setApiStatus] = useState<ServiceStatus>('checking');
  const [healthStatus, setHealthStatus] = useState<ServiceStatus>('checking');
  const [dashboardStats, setDashboardStats] = useState<LegacyDashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const legacyMode = (import.meta.env.VITE_AUTH_MODE ?? 'legacy') !== 'target-dev';

  const checkPlatform = useCallback(async () => {
    setApiStatus('checking');
    setHealthStatus('checking');
    const [ping, health] = await Promise.allSettled([
      fetch('/api/v2/ping', { credentials: 'include' }),
      fetch('/health', { credentials: 'include' }),
    ]);
    setApiStatus(ping.status === 'fulfilled' && ping.value.ok ? 'online' : 'offline');
    setHealthStatus(health.status === 'fulfilled' && health.value.ok ? 'online' : 'offline');
  }, []);

  useEffect(() => { void checkPlatform(); }, [checkPlatform]);
  useEffect(() => {
    setDashboardStats(null);
    setStatsError(null);
    const readStats = legacyMode ? legacyAuthClient.dashboardStats() : targetDashboardStats();
    readStats
      .then(setDashboardStats)
      .catch((error) => setStatsError(error instanceof Error ? error.message : 'Không tải được dashboard.'));
  }, [legacyMode]);

  const statusLabel = (status: ServiceStatus) => status === 'checking' ? 'Đang kiểm tra…' : status === 'online' ? 'Hoạt động' : 'Không khả dụng';
  const formPermissionCount = Object.keys(auth.permissions).length;
  const actionPermissionCount = Object.keys(auth.actionPermissions).length;

  return <section className="dashboard-page">
    <div className="page-heading">
      <div><p className="eyebrow">Application Platform</p><h2>Dashboard kỹ thuật</h2><p className="muted">Slice đầu tiên của FiinGroupApp, đối chiếu theo Jarvis.</p></div>
      <button type="button" onClick={() => void checkPlatform()}>Kiểm tra lại</button>
    </div>
    <div className="dashboard-grid">
      <article className="platform-card"><span className="card-label">Người dùng</span><strong>{auth.user?.fullName || auth.user?.login}</strong><small>{auth.user?.login}</small></article>
      <article className="platform-card"><span className="card-label">Authentication</span><strong>TFS domain</strong><small>Session HttpOnly đang hoạt động</small></article>
      <article className="platform-card"><span className="card-label">Form permissions</span><strong>{formPermissionCount}</strong><small>Snapshot từ target session</small></article>
      <article className="platform-card"><span className="card-label">Action permissions</span><strong>{actionPermissionCount}</strong><small>Snapshot từ target session</small></article>
    </div>
    {dashboardStats && <div className="dashboard-grid legacy-stats-grid">
      <article className="platform-card"><span className="card-label">Nhân sự</span><strong>{dashboardStats.employees.total}</strong><small>+{dashboardStats.employees.new_this_month} tháng này</small></article>
      <article className="platform-card"><span className="card-label">Dự án đang chạy</span><strong>{dashboardStats.projects.active}</strong><small>{dashboardStats.projects.total} tổng số</small></article>
      <article className="platform-card"><span className="card-label">Doanh thu YTD</span><strong>{dashboardStats.revenue.display}</strong><small>{dashboardStats.revenue.ytd_label}</small></article>
      <article className="platform-card"><span className="card-label">Đang chờ xử lý</span><strong>{dashboardStats.pending.count}</strong><small>{legacyMode ? 'Đọc từ Jarvis legacy' : 'Đọc từ target read model'}</small></article>
    </div>}
    <div className="platform-status-list">
      <div><span>ASP.NET Core API v2</span><strong className={apiStatus}>{statusLabel(apiStatus)}</strong></div>
      <div><span>Health check</span><strong className={healthStatus}>{statusLabel(healthStatus)}</strong></div>
    </div>
    <aside className="migration-note"><strong>Migration boundary</strong><p>{statsError ? `Không tải được dữ liệu Dashboard: ${statsError}` : legacyMode ? 'Đang dùng compatibility adapter read-only với JWT của Jarvis.' : 'Target đang dùng read model .NET read-only. Connection legacy phải được bật rõ ràng bằng Dashboard:LegacyStatsEnabled.'}</p></aside>
  </section>;
}
