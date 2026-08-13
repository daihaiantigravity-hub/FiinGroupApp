import { useAuth } from './AuthProvider';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  const initials = (user.fullName || user.login).trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  return <section className="profile-page">
    <div className="page-header-wrapper profile-page-header"><div className="page-title-row"><h1 className="page-title"><span className="title-icon profile-title-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M5.5 21v-2a4.5 4.5 0 0 1 9 0v2" /></svg></span>Thông tin cá nhân</h1></div></div>
    <div className="profile-container">
      <aside className="profile-sidebar">
        <div className="avatar-card">
          <div className="avatar-preview">{user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName || user.login} /> : <span>{initials}</span>}</div>
          <h3 className="avatar-name">{user.fullName || user.login}</h3>
          <p className="avatar-position">{user.positionsName || 'Chưa cập nhật chức danh'}</p>
          <div className="avatar-stats"><div><strong>{user.roles?.length ?? 0}</strong><span>Vai trò</span></div><div><strong>—</strong><span>Level TB</span></div><div><strong>—</strong><span>Năm KN</span></div></div>
        </div>
        <div className="avatar-skills-card"><div className="profile-summary-title"><h4>Kỹ năng</h4><span>Chưa có API</span></div><p>Chưa có dữ liệu kỹ năng được chuyển đổi.</p></div>
        <div className="info-summary-card"><div className="profile-summary-title"><h4>Thông tin tài khoản</h4><span>Read-only</span></div><div className="profile-summary-item"><span>Email</span><strong>—</strong></div><div className="profile-summary-item"><span>Domain</span><strong>—</strong></div><div className="profile-summary-item"><span>Đăng nhập</span><strong>{user.login}</strong></div></div>
      </aside>
      <div className="profile-main">
        <div className="profile-tabs" role="tablist"><button type="button" className="profile-tab active" role="tab" aria-selected="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M5.5 21v-2a4.5 4.5 0 0 1 9 0v2" /></svg>Thông tin cá nhân</button><button type="button" className="profile-tab" disabled title="Chưa có API hồ sơ Jarvis."><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>Chứng chỉ</button><button type="button" className="profile-tab" disabled title="Chưa có API hồ sơ Jarvis."><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>Lịch sử công việc</button><button type="button" className="profile-tab" disabled title="Chưa có API hồ sơ Jarvis."><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>Lịch sử lương</button></div>
        <article className="profile-form-card"><header><div><p className="eyebrow">Profile</p><h2>Thông tin cá nhân</h2></div><span className="profile-readonly-badge">Read-only</span></header><div className="profile-form-grid"><div><label>Họ và tên</label><strong>{user.fullName || 'Chưa cập nhật'}</strong></div><div><label>Tài khoản</label><strong>{user.login}</strong></div><div><label>Chức danh</label><strong>{user.positionsName || 'Chưa cập nhật'}</strong></div><div><label>Vai trò</label><strong>{user.roles?.length ? user.roles.join(', ') : 'Chưa cập nhật'}</strong></div></div><p className="profile-boundary-note">Thông tin chi tiết nhân sự, chứng chỉ, lịch sử công việc và lịch sử lương sẽ được mở khi API hồ sơ Jarvis được chuyển đổi và phê duyệt.</p></article>
      </div>
    </div>
  </section>;
}
