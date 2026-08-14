import { useAuth } from './AuthProvider';

const profileTabs = [
  ['basic', 'Thông tin cá nhân'],
  ['qualifications', 'Chứng chỉ'],
  ['work-history', 'Lịch sử công việc'],
  ['salary-history', 'Lịch sử lương'],
  ['contracts', 'Hợp đồng lao động'],
  ['tech-experience', 'Kinh nghiệm'],
  ['employee-assets', 'Quản lý tài sản'],
  ['time-entries', 'Task thực hiện'],
] as const;

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  const initials = (user.fullName || user.login).trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();

  return <section className="profile-page">
    <div className="page-header-wrapper profile-page-header">
      <div className="page-title-row"><h1 className="page-title"><span className="title-icon profile-title-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M5.5 21v-2a4.5 4.5 0 0 1 9 0v2" /></svg></span>Thông tin cá nhân</h1></div>
    </div>
    <div className="profile-container">
      <aside className="profile-sidebar">
        <div className="avatar-card">
          <div className="avatar-preview">{user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName || user.login} /> : <span>{initials}</span>}</div>
          <h3 className="avatar-name">{user.fullName || user.login}</h3>
          <p className="avatar-position">{user.positionsName || '—'}</p>
          <div className="avatar-stats"><div><strong>—</strong><span>Kỹ năng</span></div><div><strong>—</strong><span>Level TB</span></div><div><strong>—</strong><span>Năm KN</span></div></div>
        </div>
        <div className="avatar-skills-card"><div className="profile-summary-title"><h4>Kỹ năng</h4><span>—</span></div><p>Chưa có dữ liệu.</p></div>
        <div className="info-summary-card"><div className="profile-summary-title"><h4>Thông tin tài khoản</h4><span>Read-only</span></div>
          {['Email', 'Git', 'SVN', 'Redmine', 'Domain', 'IP'].map(label => <div className="profile-summary-item" key={label}><span>{label}</span><strong>{label === 'Domain' ? 'TFS' : '—'}</strong></div>)}
        </div>
      </aside>
      <div className="profile-main">
        <div className="profile-tabs source-profile-tabs" role="tablist">
          {profileTabs.map(([key, label], index) => <button key={key} type="button" className={'profile-tab' + (index === 0 ? ' active' : '')} role="tab" aria-selected={index === 0} disabled={index !== 0} title={index === 0 ? undefined : 'Chưa có API hồ sơ Jarvis.'}>{label}</button>)}
          <button type="button" className="profile-save-button" disabled title="Chưa có API hồ sơ Jarvis.">Lưu</button>
        </div>
        <article className="profile-form-card"><header><div><p className="eyebrow">Thông tin cá nhân</p><h2>Thông tin cá nhân</h2></div><span className="profile-readonly-badge">Read-only</span></header>
          <div className="profile-form-grid"><div><label>Họ và tên</label><strong>{user.fullName || '—'}</strong></div><div><label>Tài khoản</label><strong>{user.login}</strong></div><div><label>Chức danh</label><strong>{user.positionsName || '—'}</strong></div><div><label>Vai trò</label><strong>{user.roles?.length ? user.roles.join(', ') : '—'}</strong></div></div>
          <p className="profile-boundary-note">Các tab còn lại giữ đúng cấu trúc hồ sơ Jarvis nhưng đang chờ API hồ sơ và quyền tương ứng.</p>
        </article>
      </div>
    </div>
  </section>;
}
