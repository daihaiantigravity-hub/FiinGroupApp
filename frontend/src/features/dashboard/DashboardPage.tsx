import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { legacyAuthClient, type LegacyAnnouncementItem, type LegacyDashboardStats } from '../auth/legacyAuthClient';
import { targetDashboardStats } from '../auth/targetAuthClient';

export default function DashboardPage() {
  const auth = useAuth();
  const [dashboardStats, setDashboardStats] = useState<LegacyDashboardStats | null>(null);
  const [announcements, setAnnouncements] = useState<LegacyAnnouncementItem[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const legacyMode = (import.meta.env.VITE_AUTH_MODE ?? 'legacy') !== 'target-dev';

  useEffect(() => {
    setDashboardStats(null);
    setStatsError(null);
    const readStats = legacyMode ? legacyAuthClient.dashboardStats() : targetDashboardStats();
    readStats
      .then(setDashboardStats)
      .catch((error) => setStatsError(error instanceof Error ? error.message : 'Không tải được dashboard.'));
  }, [legacyMode]);

  useEffect(() => {
    setAnnouncements([]);
    setAnnouncementsError(null);
    if (!legacyMode) return;
    legacyAuthClient.announcementList({ limit: '5' })
      .then(setAnnouncements)
      .catch((error) => setAnnouncementsError(error instanceof Error ? error.message : 'Không tải được thông báo.'));
  }, [legacyMode]);

  const displayName = auth.user?.fullName || auth.user?.login || 'User';
  const currentYear = new Date().getFullYear();

  return <section className="dashboard-page">
    <div className="page-header-wrapper">
      <div className="page-title-row">
        <h1 className="page-title">Dashboard</h1>
      </div>
      <div className="dashboard-greeting"><span className="greeting-text">Xin chào, {displayName}</span></div>
    </div>

    <div className="stats-grid source-stats-grid">
      <article className="stat-card stat-primary kpi-stat-card" title="KPI Doanh thu">
        <div className="stat-icon">▥</div>
        <div className="stat-info"><span className="stat-label">KPI {currentYear}</span><div className="kpi-mini-bars"><span>CT —</span><span>LN —</span><span>KH —</span></div></div>
      </article>
      <article className="stat-card stat-success" title="Dự án đang chạy">
        <div className="stat-circle-icon"><span className="stat-ring-text">{dashboardStats?.projects.active ?? '—'}</span></div>
        <div className="stat-info"><span className="stat-value">{dashboardStats?.projects.active ?? '—'}</span><span className="stat-label">Dự án đang chạy</span></div>
        <div className="stat-trend up">+{dashboardStats?.projects.new ?? '—'} mới</div>
      </article>
      <article className="stat-card stat-warning" title="Doanh thu">
        <div className="stat-icon">₫</div>
        <div className="stat-info"><span className="stat-value">{dashboardStats?.revenue.display ?? '—'}</span><span className="stat-label">Doanh thu</span></div>
        <div className="stat-trend">{dashboardStats?.revenue.ytd_label ?? '—'}</div>
      </article>
      <article className="stat-card stat-danger pending-donut-card" title="Chờ duyệt">
        <div className="stat-icon">!</div>
        <div className="stat-info"><span className="stat-value">{dashboardStats?.pending.count ?? '—'}</span><span className="stat-label">Chờ duyệt</span></div>
      </article>
    </div>

    <div className="dashboard-top-row">
      <div className="dashboard-left-stack">
        <article className="card card-activities">
          <div className="card-header"><h2 className="card-title">Hoạt động gần đây</h2><span className="card-action">Xem tất cả</span></div>
          <div className="card-body"><div className="dashboard-empty">Chưa có dữ liệu hoạt động.</div></div>
        </article>
      </div>
      <div className="dashboard-right-stack">
        <article className="card card-announcements">
          <div className="card-header"><h2 className="card-title">Thông báo &amp; Tài liệu</h2><a className="card-action" href="/announcements">Xem tất cả ›</a></div>
          <div className="card-body dashboard-announcement-list">
            {announcements.length > 0 ? announcements.map(item => <div className="dashboard-announcement" key={item.id}><strong>{item.title || 'Không có tiêu đề'}</strong><small>{item.publish_date || '—'}</small></div>) : <div className="dashboard-empty">{announcementsError ? 'Không tải được thông báo.' : 'Chưa có thông báo.'}</div>}
          </div>
        </article>
      </div>
    </div>

    {statsError && <div className="dashboard-data-error">{statsError}</div>}
  </section>;
}
