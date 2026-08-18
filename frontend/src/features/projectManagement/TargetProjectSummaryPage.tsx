import { NavLink } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  getProjectManagementProjectSummaries,
  getProjectManagementSummary,
  getProjectManagementSummaryPage,
  projectManagementProjectLabel,
  sortProjectManagementProjects,
  type ProjectManagementProjectSummary,
  type ProjectManagementSummaryListItem,
} from './projectManagementClient';
import TargetSummaryInheritancePreview from './TargetSummaryInheritancePreview';

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value.includes(' ') ? value.replace(' ', 'T') : `${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('vi-VN');
}

function statusLabel(status: number) {
  return ({ '-1': 'Chờ kích hoạt', 0: 'Chờ thực hiện', 1: 'Đang thực hiện', 2: 'Đang triển khai', 5: 'Kết thúc', 6: 'Hết hiệu lực' } as Record<string, string>)[String(status)] ?? `Mã ${status}`;
}

function statusClass(status: number) {
  return ({ '-1': 'pending', 0: '0', 1: '1', 2: '1', 5: '3', 6: '2' } as Record<string, string>)[String(status)] ?? 'unknown';
}

function summaryStatusLabel(status: number) {
  return ({ 0: 'Chưa hoạt động', 1: 'Hoạt động', 9: 'Đã ẩn' } as Record<number, string>)[status] ?? `Mã ${status}`;
}

function summarySectionLabel(sectionType: number) {
  return ({ 1: 'Tiến độ tuần', 2: 'Kế hoạch tuần' } as Record<number, string>)[sectionType] ?? `Section ${sectionType}`;
}

function gap(summary: ProjectManagementProjectSummary) {
  return summary.latestActualPercent - summary.latestPlanPercent;
}

export default function TargetProjectSummaryPage() {
  const [summaries, setSummaries] = useState<ProjectManagementProjectSummary[]>([]);
  const [customer, setCustomer] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [health, setHealth] = useState('all');
  const [sort, setSort] = useState('overdue');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyRows, setHistoryRows] = useState<ProjectManagementSummaryListItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyYear, setHistoryYear] = useState('');
  const [historyWeek, setHistoryWeek] = useState('');
  const [historyCustomer, setHistoryCustomer] = useState('');
  const [historyManager, setHistoryManager] = useState('');
  const [historyProjectId, setHistoryProjectId] = useState('');
  const [historySectionType, setHistorySectionType] = useState('');
  const [historyStatus, setHistoryStatus] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [selectedSummary, setSelectedSummary] = useState<ProjectManagementSummaryListItem | null>(null);
  const [summaryDetailLoading, setSummaryDetailLoading] = useState(false);
  const [summaryDetailError, setSummaryDetailError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    void getProjectManagementProjectSummaries()
      .then(setSummaries)
      .catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được tổng hợp project.'))
      .finally(() => setLoading(false));
  };

  const loadHistory = () => {
    setHistoryLoading(true);
    setHistoryError(null);
    void getProjectManagementSummaryPage({
      year: historyYear ? Number(historyYear) : undefined,
      week: historyWeek ? Number(historyWeek) : undefined,
      customer: historyCustomer || undefined,
      projectManager: historyManager || undefined,
      projectId: historyProjectId ? Number(historyProjectId) : undefined,
      sectionType: historySectionType ? Number(historySectionType) : undefined,
      status: historyStatus ? Number(historyStatus) : undefined,
      limit: 50,
      offset: historyPage * 50,
    }).then(page => {
      setHistoryRows(page.rows);
      setHistoryTotal(page.total);
    }).catch(exception => setHistoryError(exception instanceof Error ? exception.message : 'Không tải được lịch sử summary.'))
      .finally(() => setHistoryLoading(false));
  };

  const openSummaryDetail = (summaryId: number) => {
    setSummaryDetailLoading(true);
    setSummaryDetailError(null);
    void getProjectManagementSummary(summaryId)
      .then(setSelectedSummary)
      .catch(exception => setSummaryDetailError(exception instanceof Error ? exception.message : 'Không tải được detail summary.'))
      .finally(() => setSummaryDetailLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadHistory(); }, [historyCustomer, historyManager, historyPage, historyProjectId, historySectionType, historyStatus, historyWeek, historyYear]);
  const customers = useMemo(() => [...new Set(summaries.map(item => item.project.customer).filter(Boolean))].sort(), [summaries]);
  const managers = useMemo(() => [...new Set(summaries.map(item => item.project.projectManager).filter(Boolean))].sort(), [summaries]);
  const historyProjects = useMemo(() => summaries.map(item => item.project).filter((project, index, all) => all.findIndex(candidate => candidate.id === project.id) === index), [summaries]);
  const filteredHistoryProjects = useMemo(() => sortProjectManagementProjects(historyProjects.filter(project =>
    (!historyCustomer || project.customer === historyCustomer) &&
    (!historyManager || project.projectManager === historyManager)
  )), [historyCustomer, historyManager, historyProjects]);
  const historyYears = useMemo(() => [...new Set([...summaries.map(item => item.latestSummaryYear), ...historyRows.map(row => row.summary.year)].filter((value): value is number => value !== null))].sort((left, right) => right - left), [historyRows, summaries]);

  const rows = useMemo(() => {
    const filtered = summaries.filter(item => {
      if (customer && item.project.customer !== customer) return false;
      if (projectManager && item.project.projectManager !== projectManager) return false;
      if (health === 'overdue' && item.overdueTaskCount === 0) return false;
      if (health === 'no-summary' && item.latestSummaryYear === null) return false;
      if (health === 'no-task' && item.taskCount > 0) return false;
      return true;
    });
    return [...filtered].sort((left, right) => {
      if (sort === 'progress') return right.averageProgress - left.averageProgress;
      if (sort === 'gap') return gap(left) - gap(right);
      if (sort === 'project') return (left.project.projectCode || '').localeCompare(right.project.projectCode || '');
      return right.overdueTaskCount - left.overdueTaskCount || left.averageProgress - right.averageProgress;
    });
  }, [customer, health, projectManager, sort, summaries]);

  const stats = useMemo(() => ({
    projects: rows.length,
    overdue: rows.reduce((sum, item) => sum + item.overdueTaskCount, 0),
    tasks: rows.reduce((sum, item) => sum + item.taskCount, 0),
    progress: rows.length ? Math.round(rows.reduce((sum, item) => sum + item.averageProgress, 0) / rows.length) : 0,
    budget: rows.reduce((sum, item) => sum + item.project.budget, 0),
  }), [rows]);

  return <section className="local-pm-page target-project-summary-page">
    <div className="page-heading">
      <div><p className="eyebrow">Target project-management store</p><h2>Tổng hợp dự án</h2><p className="muted">Bảng đọc-only tổng hợp từ project, WBS, Task Plan và summary tuần của target store.</p></div>
      <button type="button" onClick={load} disabled={loading}>{loading ? 'Đang tải...' : 'Làm mới'}</button>
    </div>
    <div className="local-pm-banner"><strong>Chế độ kiểm chứng read-only</strong><span>Không gọi pm-flow của Jarvis, không suy diễn mapping TFS và không hiển thị chi phí thực ngoài các trường budget của pm_project.</span></div>
    <div className="target-project-summary-toolbar">
      <label>Khách hàng<select value={customer} onChange={event => setCustomer(event.target.value)}><option value="">Tất cả</option>{customers.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>PM<select value={projectManager} onChange={event => setProjectManager(event.target.value)}><option value="">Tất cả</option>{managers.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Tình trạng<select value={health} onChange={event => setHealth(event.target.value)}><option value="all">Tất cả</option><option value="overdue">Có task quá hạn</option><option value="no-summary">Chưa có summary tuần</option><option value="no-task">Chưa có task</option></select></label>
      <label>Sắp xếp<select value={sort} onChange={event => setSort(event.target.value)}><option value="overdue">Quá hạn nhiều nhất</option><option value="progress">Tiến độ cao nhất</option><option value="gap">Actual thấp hơn Plan</option><option value="project">Theo mã project</option></select></label>
    </div>
    <div className="local-pm-stats target-project-summary-stats"><div><span>Project</span><strong>{stats.projects}</strong></div><div><span>Task quá hạn</span><strong>{stats.overdue}</strong></div><div><span>Tổng task</span><strong>{stats.tasks}</strong></div><div><span>Tiến độ TB</span><strong>{stats.progress}%</strong></div><div><span>Tổng budget</span><strong>{formatMoney(stats.budget)}</strong></div></div>
    {error && <p className="error">{error}</p>}
    {loading ? <div className="local-pm-empty">Đang tải tổng hợp dự án…</div> : !rows.length ? <div className="local-pm-empty">Không có project phù hợp với bộ lọc hiện tại.</div> : <section className="platform-card target-project-summary-card"><header><div><span className="card-label">Project summary read model</span><h3>{rows.length} project</h3></div><span className="muted">Dữ liệu được tính từ target schema</span></header><div className="table-scroll-x"><table className="data-table target-project-summary-table"><thead><tr><th>Project</th><th>PM / khách hàng</th><th>Trạng thái</th><th>Task</th><th>Tiến độ TB</th><th>Quá hạn</th><th>Latest Plan / Actual</th><th>Budget</th><th>Summary</th><th></th></tr></thead><tbody>{rows.map(item => {
      const project = item.project;
      const actualGap = gap(item);
      return <tr key={project.id}>
        <td><strong>{project.projectCode || `#${project.id}`}</strong><small>{project.annexNo || project.annexName || '—'}</small></td>
        <td><strong>{project.projectManager || '—'}</strong><small>{project.customer}</small></td>
        <td><span className={'target-project-status status-' + statusClass(project.status)}>{statusLabel(project.status)}</span></td>
        <td><strong>{item.taskCount}</strong><small>{item.completedTaskCount} hoàn tất · {item.activeTaskCount} đang làm</small></td>
        <td><div className="target-project-progress"><span><i style={{ width: `${Math.max(0, Math.min(100, item.averageProgress))}%` }} /></span><strong>{Math.round(item.averageProgress)}%</strong></div></td>
        <td><span className={item.overdueTaskCount ? 'target-project-overdue has-overdue' : 'target-project-overdue'}>{item.overdueTaskCount}</span><small>{item.dependencyCount} phụ thuộc</small></td>
        <td><strong>{Math.round(item.latestPlanPercent)}% / {Math.round(item.latestActualPercent)}%</strong><small className={actualGap < 0 ? 'target-project-gap negative' : 'target-project-gap'}>{actualGap > 0 ? '+' : ''}{Math.round(actualGap)} điểm</small></td>
        <td>{formatMoney(project.budget)}<small>{formatDate(project.startDate)} → {formatDate(project.endDate)}</small></td>
        <td>{item.latestSummaryWeek ? <><strong>W{item.latestSummaryWeek}/{item.latestSummaryYear}</strong><small>{item.latestSummaryNotes || 'Không có ghi chú'}</small></> : <span className="muted">Chưa có</span>}</td>
        <td className="target-project-summary-actions"><NavLink className="project-work-item-link" to={`/projectmanagement-local?projectId=${project.id}`}>Workspace</NavLink><NavLink className="project-work-item-action" to={`/task-plan-list-local?projectId=${project.id}`}>Task Plan</NavLink></td>
      </tr>;
    })}</tbody></table></div><footer className="target-project-summary-footer"><span>Read-only target store · không có thao tác ghi.</span></footer></section>}

    <section className="platform-card target-project-summary-card target-project-summary-history"><header><div><span className="card-label">Jarvis /summaries read slice</span><h3>Lịch sử tổng hợp tuần</h3></div><div className="target-project-summary-history-actions"><span className="muted">{historyTotal} bản ghi</span><button type="button" onClick={loadHistory} disabled={historyLoading}>{historyLoading ? 'Đang tải...' : 'Làm mới'}</button></div></header>
      <p className="target-project-summary-history-hint">Nhấp đúp vào một dòng để xem chi tiết read-only.</p><div className="target-project-summary-history-filters">
        <label>Năm<select value={historyYear} onChange={event => { setHistoryYear(event.target.value); setHistoryPage(0); }}><option value="">Tất cả</option>{historyYears.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Tuần<select value={historyWeek} onChange={event => { setHistoryWeek(event.target.value); setHistoryPage(0); }}><option value="">Tất cả</option>{Array.from({ length: 53 }, (_, index) => index + 1).map(value => <option key={value} value={value}>W{value}</option>)}</select></label>
        <label>PM<select value={historyManager} onChange={event => { setHistoryManager(event.target.value); setHistoryProjectId(''); setHistoryPage(0); }}><option value="">Tất cả</option>{managers.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Khách hàng<select value={historyCustomer} onChange={event => { setHistoryCustomer(event.target.value); setHistoryProjectId(''); setHistoryPage(0); }}><option value="">Tất cả</option>{customers.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Project<select value={historyProjectId} onChange={event => { setHistoryProjectId(event.target.value); setHistoryPage(0); }}><option value="">Tất cả</option>{filteredHistoryProjects.map(project => <option key={project.id} value={project.id}>{projectManagementProjectLabel(project)}</option>)}</select></label>
        <label>Section<select value={historySectionType} onChange={event => { setHistorySectionType(event.target.value); setHistoryPage(0); }}><option value="">Tất cả</option><option value="1">Tiến độ tuần</option><option value="2">Kế hoạch tuần</option></select></label>
        <label>Trạng thái<select value={historyStatus} onChange={event => { setHistoryStatus(event.target.value); setHistoryPage(0); }}><option value="">Đang hiển thị</option><option value="0">Chưa hoạt động</option><option value="1">Hoạt động</option></select></label>
      </div>
      {historyError && <p className="error target-project-summary-history-error">{historyError}</p>}
      {historyLoading ? <div className="local-pm-empty">Đang tải lịch sử summary…</div> : !historyRows.length ? <div className="local-pm-empty">Không có bản ghi summary phù hợp.</div> : <div className="table-scroll-x"><table className="data-table target-project-summary-history-table"><thead><tr><th>ID / tuần</th><th>Project</th><th>PM / khách hàng</th><th>Section</th><th>Plan</th><th>Actual</th><th>Thời gian</th><th>Ghi chú</th><th>Cập nhật</th><th></th></tr></thead><tbody>{historyRows.map(row => { const summary = row.summary; return <tr key={summary.id} tabIndex={0} onDoubleClick={() => openSummaryDetail(summary.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openSummaryDetail(summary.id); } }}><td><strong>#{summary.id}</strong><small>W{summary.week ?? '—'}/{summary.year ?? '—'}</small></td><td><strong>{row.projectCode || row.annexNo || row.annexName || `#${summary.projectId}`}</strong><small>{row.annexName || summary.annexName || '—'}</small></td><td><strong>{summary.projectManager || row.projectManager || '—'}</strong><small>{summary.customer || '—'}</small></td><td><span className="target-project-summary-section">{summarySectionLabel(summary.sectionType)}</span><small>Entry {summary.entryType}</small></td><td><strong>{Math.round(summary.planPercent)}%</strong></td><td><strong className={summary.actualPercent < summary.planPercent ? 'target-project-gap negative' : 'target-project-gap'}>{Math.round(summary.actualPercent)}%</strong></td><td>{formatDate(summary.startDate)}<small>→ {formatDate(summary.endDate)}</small></td><td className="target-project-summary-history-note">{summary.notes || '—'}<small>{summary.resources || 'Không có resource'}</small></td><td>{summary.updatedBy || '—'}</td><td>{row.projectRecordId ? <NavLink className="project-work-item-link" to={`/projectmanagement-local?projectId=${row.projectRecordId}`} onClick={event => event.stopPropagation()}>Mở project</NavLink> : <span className="muted">Chưa mapping</span>}</td></tr>; })}</tbody></table></div>}
      <footer className="target-project-summary-footer target-project-summary-history-footer"><span>Trang {historyTotal ? historyPage + 1 : 0} / {historyTotal ? Math.ceil(historyTotal / 50) : 0}</span><div><button type="button" onClick={() => setHistoryPage(page => Math.max(0, page - 1))} disabled={historyPage === 0 || historyLoading}>‹ Trước</button><button type="button" onClick={() => setHistoryPage(page => page + 1)} disabled={historyLoading || (historyPage + 1) * 50 >= historyTotal}>Sau ›</button></div></footer>
    </section>
    {summaryDetailError && <p className="error target-project-summary-history-error">{summaryDetailError}</p>}
    {summaryDetailLoading && <div className="local-pm-empty">Đang tải chi tiết summary…</div>}
    {selectedSummary && !summaryDetailLoading && <section className="target-project-summary-detail"><header><div><span className="card-label">Summary #{selectedSummary.summary.id}</span><h3>{selectedSummary.projectCode || selectedSummary.annexName || `Project ${selectedSummary.summary.projectId}`}</h3></div><button type="button" onClick={() => setSelectedSummary(null)}>Đóng</button></header><div className="target-project-summary-detail-grid"><div><span>Tuần / năm</span><strong>W{selectedSummary.summary.week ?? '—'} / {selectedSummary.summary.year ?? '—'}</strong></div><div><span>PM</span><strong>{selectedSummary.summary.projectManager || selectedSummary.projectManager || '—'}</strong></div><div><span>Khách hàng</span><strong>{selectedSummary.summary.customer || '—'}</strong></div><div><span>Section</span><strong>{summarySectionLabel(selectedSummary.summary.sectionType)}</strong></div><div><span>Plan / Actual</span><strong>{Math.round(selectedSummary.summary.planPercent)}% / {Math.round(selectedSummary.summary.actualPercent)}%</strong></div><div><span>Trạng thái</span><strong>{summaryStatusLabel(selectedSummary.summary.status)}</strong></div><div><span>Bắt đầu</span><strong>{formatDate(selectedSummary.summary.startDate)}</strong></div><div><span>Kết thúc</span><strong>{formatDate(selectedSummary.summary.endDate)}</strong></div><div><span>Cập nhật bởi</span><strong>{selectedSummary.summary.updatedBy || '—'}</strong></div><div><span>Contract type</span><strong>{selectedSummary.contractType ?? '—'}</strong></div></div><div className="target-project-summary-detail-copy"><span>Notes</span><p>{selectedSummary.summary.notes || 'Không có ghi chú.'}</p></div><div className="target-project-summary-detail-copy"><span>Resources</span><p>{selectedSummary.summary.resources || 'Không có resource.'}</p></div></section>}
    <TargetSummaryInheritancePreview year={historyYear} week={historyWeek} customer={historyCustomer} projectManager={historyManager} projectId={historyProjectId} projects={summaries} />
  </section>;
}
