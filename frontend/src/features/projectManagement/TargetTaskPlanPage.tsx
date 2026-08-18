import { NavLink, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  getProjectManagementPlanPage,
  getProjectManagementProjects,
  projectManagementProjectLabel,
  sortProjectManagementProjects,
  type ProjectManagementPlanSortField,
  type ProjectManagementPlanSortOrder,
  type ProjectManagementPlanListItem,
  type ProjectManagementPlanPage as PlanPage,
  type ProjectManagementPlanQuery,
  type ProjectManagementProject,
} from './projectManagementClient';

type TaskPlanMode = 'list' | 'week';
type TargetPlanRow = ProjectManagementPlanListItem & { inherited?: boolean };

function getIsoWeekInfo(date = new Date()) {
  const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return {
    year: value.getUTCFullYear(),
    week: Math.ceil((((value.getTime() - yearStart.getTime()) / 86400000) + 1) / 7),
  };
}

function getIsoWeek(date = new Date()) {
  return getIsoWeekInfo(date).week;
}

function getWeekRange(year: number, week: number) {
  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const day = januaryFourth.getUTCDay() || 7;
  const start = new Date(januaryFourth);
  start.setUTCDate(start.getUTCDate() - day + 1 + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return { start, end };
}

function formatCompactDate(value: Date) {
  return `${String(value.getUTCDate()).padStart(2, '0')}/${String(value.getUTCMonth() + 1).padStart(2, '0')}/${value.getUTCFullYear()}`;
}

function getPreviousIsoWeek(year: number, week: number) {
  if (week > 1) return { year, week: week - 1 };
  const previousYearDate = new Date(Date.UTC(year - 1, 11, 28));
  return { year: year - 1, week: getIsoWeek(previousYearDate) };
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value.includes(' ') ? value.replace(' ', 'T') : `${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('vi-VN');
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value.includes(' ') ? value.replace(' ', 'T') : value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('vi-VN');
}

function percent(value: number | null) {
  return value === null ? '—' : `${Math.round(value)}%`;
}

function sectionLabel(sectionType: number) {
  return sectionType === 1 ? 'Weekly progress' : sectionType === 2 ? 'Next plan' : `Section ${sectionType}`;
}

function entryTypeLabel(entryType: number) {
  return entryType === 1 ? 'Phát sinh' : 'Kế hoạch chuẩn / kế thừa';
}

function weekLabel(year: number | '', week: number | '') {
  return year === '' || week === '' ? 'Chưa chọn tuần' : `W${String(week).padStart(2, '0')}/${year}`;
}

function statusLabel(status: number) {
  return status === 1 ? 'Hiệu lực' : status === 9 ? 'Đã xóa' : `Mã ${status}`;
}

function projectLabel(item: TargetPlanRow) {
  const plan = item.plan;
  const projectId = item.projectRecordId ?? plan.projectId;
  const code = item.annexNo || item.projectCode || item.annexName || (projectId ? `#${projectId}` : 'Chưa gắn project');
  if (!plan.customer) return projectId ? `${projectId} - ${code}` : code;
  return `${plan.customer} - ${code}${projectId ? ` || ${projectId}` : ''}`;
}

function PlanTable({ rows, selectedId, onSelect, sortField, sortOrder, onSort }: {
  rows: TargetPlanRow[];
  selectedId: number | null;
  onSelect: (item: TargetPlanRow) => void;
  sortField?: ProjectManagementPlanSortField;
  sortOrder?: ProjectManagementPlanSortOrder;
  onSort?: (field: ProjectManagementPlanSortField) => void;
}) {
  const sortHeader = (label: string, field: ProjectManagementPlanSortField) => onSort ? <button
    type="button"
    className="target-task-plan-sort-button"
    aria-label={`Sắp xếp theo ${label}`}
    aria-sort={sortField === field ? sortOrder === 'asc' ? 'ascending' : 'descending' : 'none'}
    onClick={() => onSort(field)}
  >{label}<span aria-hidden="true">{sortField === field ? sortOrder === 'asc' ? ' ↑' : ' ↓' : ' ↕'}</span></button> : label;
  return <div className="table-scroll-x target-task-plan-table-scroll">
    <table className="data-table target-task-plan-table">
      <thead><tr><th>{sortHeader('ID', 'id')}</th><th>{sortHeader('Năm / tuần', 'year')}</th><th>{sortHeader('Loại', 'section_type')}</th><th>{sortHeader('Khách hàng / project', 'customer')}</th><th>{sortHeader('Nội dung công việc', 'task_desc')}</th><th>{sortHeader('Khoảng thời gian', 'from_date')}</th><th>{sortHeader('Plan', 'plan_percent')}</th><th>{sortHeader('Actual', 'actual_percent')}</th><th>{sortHeader('Kết quả', 'result_notes')}</th><th>{sortHeader('Nguồn lực', 'resource')}</th><th>{sortHeader('Người tạo', 'created_by')}</th><th>{sortHeader('Trạng thái', 'status')}</th><th></th></tr></thead>
      <tbody>{rows.map(item => {
        const plan = item.plan;
        const rowKey = item.inherited ? `inherited-${plan.sourcePlanId ?? plan.id}` : String(plan.id);
        return <tr key={rowKey} className={`${selectedId === plan.id ? 'target-task-plan-row-selected' : ''} ${item.inherited ? 'target-task-plan-row-inherited' : ''}`} tabIndex={0} onClick={() => onSelect(item)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(item); } }}>
          <td>{item.inherited ? <span className="target-task-plan-inherited-badge">Kế thừa</span> : plan.id}</td>
          <td><strong>{plan.year}</strong><small>W{String(plan.week).padStart(2, '0')}</small></td>
          <td><span className={'target-task-plan-type type-' + plan.sectionType}>{sectionLabel(plan.sectionType)}</span></td>
          <td><strong>{projectLabel(item)}</strong><small>{item.projectManager ? `PM: ${item.projectManager}` : 'Chưa có PM'}</small></td>
          <td className="target-task-plan-description"><strong>{plan.taskDescription}</strong><small>{plan.remarks || '—'}</small></td>
          <td>{formatDate(plan.fromDate)}<small>→ {formatDate(plan.toDate)}</small></td>
          <td><div className="target-task-plan-percent"><span><i style={{ width: `${Math.max(0, Math.min(100, plan.planProgress))}%` }} /></span><strong>{percent(plan.planProgress)}</strong></div></td>
          <td>{percent(plan.currentProgress)}</td>
          <td>{percent(plan.resultProgress)}<small>{plan.resultNotes || 'Chưa có kết quả'}</small></td>
          <td>{plan.resource || '—'}</td>
          <td>{plan.createdBy || '—'}</td>
          <td><span className="target-task-plan-status">{statusLabel(plan.status)}</span></td>
          <td className="target-task-plan-actions">{item.projectRecordId ? <NavLink className="project-work-item-link" to={`/projectmanagement-local?projectId=${item.projectRecordId}`} onClick={event => event.stopPropagation()}>Mở project</NavLink> : <span className="muted">—</span>}<button type="button" className="target-task-plan-detail-button" onClick={event => { event.stopPropagation(); onSelect(item); }}>Chi tiết</button></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

function WeekBoard({ rows, selectedId, onSelect }: { rows: TargetPlanRow[]; selectedId: number | null; onSelect: (item: TargetPlanRow) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, TargetPlanRow[]>();
    rows.forEach(row => {
      const key = String(row.projectRecordId ?? `unassigned-${row.plan.customer || 'unknown'}`);
      map.set(key, [...(map.get(key) ?? []), row]);
    });
    return [...map.entries()];
  }, [rows]);

  return <div className="target-task-plan-week-board">{groups.map(([key, items]) => {
    const progressRows = items.filter(item => item.plan.sectionType === 1);
    const nextPlanRows = items.filter(item => item.plan.sectionType === 2);
    return <section className="platform-card target-task-plan-week-card" key={key}>
      <header><div><span className="card-label">Project / customer</span><h3>{projectLabel(items[0])}</h3></div><span className="muted">{items.length} dòng</span></header>
      <div className="target-task-plan-week-section"><div className="target-task-plan-week-section-heading"><div><strong>Weekly progress</strong><small>Tiến độ và kết quả tuần đang xem</small></div><span>{progressRows.length} dòng</span></div>{progressRows.length ? <PlanTable rows={progressRows} selectedId={selectedId} onSelect={onSelect} /> : <div className="target-task-plan-week-empty">Chưa có progress lưu hoặc kế thừa.</div>}</div>
      <div className="target-task-plan-week-section"><div className="target-task-plan-week-section-heading"><div><strong>Next plan</strong><small>Kế hoạch tiếp theo của project</small></div><span>{nextPlanRows.length} dòng</span></div>{nextPlanRows.length ? <PlanTable rows={nextPlanRows} selectedId={selectedId} onSelect={onSelect} /> : <div className="target-task-plan-week-empty">Chưa có Next Plan.</div>}</div>
    </section>;
  })}</div>;
}

function PlanDetail({ item }: { item: TargetPlanRow }) {
  const plan = item.plan;
  return <section className="platform-card target-task-plan-detail">
    <header><div><span className="card-label">Task Plan detail</span><h3>{plan.taskDescription}</h3></div><span className={'target-task-plan-type type-' + plan.sectionType}>{sectionLabel(plan.sectionType)}</span></header>
    <div className="target-task-plan-detail-grid">
      <div><span>ID / tuần</span><strong>{item.inherited ? `Kế thừa từ #${plan.sourcePlanId}` : `#${plan.id}`} · W{String(plan.week).padStart(2, '0')}/{plan.year}</strong></div>
      <div><span>Project</span><strong>{projectLabel(item)}</strong></div>
      <div><span>Entry type</span><strong>{entryTypeLabel(plan.entryType)}</strong></div>
      <div><span>Source plan</span><strong>{plan.sourcePlanId ? `#${plan.sourcePlanId}` : 'Không có'}</strong></div>
      <div><span>Khoảng thời gian</span><strong>{formatDate(plan.fromDate)} → {formatDate(plan.toDate)}</strong></div>
      <div><span>Thứ tự</span><strong>{plan.sortOrder}</strong></div>
      <div><span>Người tạo</span><strong>{plan.createdBy || '—'}</strong></div>
      <div><span>Ngày tạo</span><strong>{formatDateTime(plan.createdAt)}</strong></div>
      <div><span>Plan / Actual</span><strong>{percent(plan.planProgress)} / {percent(plan.currentProgress)}</strong></div>
      <div><span>Kết quả</span><strong>{percent(plan.resultProgress)}</strong></div>
      <div><span>Project manager</span><strong>{item.projectManager || '—'}</strong></div>
      <div><span>Trạng thái</span><strong>{statusLabel(plan.status)}</strong></div>
    </div>
    <div className="target-task-plan-detail-copy"><span>Kết quả / ghi chú</span><p>{plan.resultNotes || 'Chưa có kết quả hoặc ghi chú.'}</p></div>
    <div className="target-task-plan-detail-copy"><span>Nguồn lực</span><p>{plan.resource || 'Chưa khai báo nguồn lực.'}</p></div>
    <div className="target-task-plan-detail-copy"><span>Remarks</span><p>{plan.remarks || 'Không có remarks.'}</p></div>
    <footer className="target-task-plan-detail-footer"><span>Read-only target store · dòng kế thừa chỉ là preview, không ghi bản sao.</span>{item.projectRecordId && <NavLink className="project-work-item-link" to={`/projectmanagement-local?projectId=${item.projectRecordId}`}>Mở workspace project</NavLink>}</footer>
  </section>;
}

export default function TargetTaskPlanPage({ mode = 'list' }: { mode?: TaskPlanMode }) {
  const [searchParams] = useSearchParams();
  const requestedProjectId = Number(searchParams.get('projectId')) || null;
  const currentWeekInfo = getIsoWeekInfo();
  const currentYear = currentWeekInfo.year;
  const currentWeek = currentWeekInfo.week;
  const [projects, setProjects] = useState<ProjectManagementProject[]>([]);
  const [rows, setRows] = useState<TargetPlanRow[]>([]);
  const [page, setPage] = useState<PlanPage | null>(null);
  const [year, setYear] = useState<number | ''>(currentYear);
  const [week, setWeek] = useState<number | ''>(currentWeek);
  const [projectId, setProjectId] = useState<number | ''>(requestedProjectId ?? '');
  const [customer, setCustomer] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [sectionType, setSectionType] = useState<number | ''>(mode === 'week' ? '' : 1);
  const [status, setStatus] = useState<number | ''>(1);
  const [sortField, setSortField] = useState<ProjectManagementPlanSortField>('id');
  const [sortOrder, setSortOrder] = useState<ProjectManagementPlanSortOrder>('desc');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<TargetPlanRow | null>(null);

  useEffect(() => {
    let active = true;
    void getProjectManagementProjects().then(result => { if (active) setProjects(result); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setProjectId(requestedProjectId ?? '');
  }, [requestedProjectId]);

  const query = useMemo<ProjectManagementPlanQuery>(() => ({
    year: year === '' ? undefined : year,
    week: week === '' ? undefined : week,
    projectId: projectId === '' ? undefined : projectId,
    customer: customer || undefined,
    projectManager: projectManager || undefined,
    sectionType: sectionType === '' ? undefined : sectionType,
    status: status === '' ? undefined : status,
    sort: sortField,
    order: sortOrder,
    limit: mode === 'week' ? 200 : 50,
    offset: 0,
  }), [customer, mode, projectId, projectManager, sectionType, sortField, sortOrder, status, week, year]);
  const queryKey = JSON.stringify(query);

  const selectedWeekRange = useMemo(() => year === '' || week === '' ? null : getWeekRange(year, week), [week, year]);
  const moveWeek = (delta: number) => {
    const base = year === '' || week === '' ? getWeekRange(currentYear, currentWeek).start : getWeekRange(year, week).start;
    base.setUTCDate(base.getUTCDate() + delta * 7);
    const next = getIsoWeekInfo(base);
    setYear(next.year);
    setWeek(next.week);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const result = await getProjectManagementPlanPage(query);
        if (!active) return;
        if (mode !== 'week' || year === '' || week === '' || (sectionType !== '' && sectionType !== 1)) {
          setRows(result.rows);
          setPage(result);
          setSelectedPlan(null);
          return;
        }

        // Jarvis only materializes the previous week's Next Plan when the
        // selected week has no rows at all. If the week already contains a
        // progress or next-plan row, it renders those rows as-is.
        if (result.rows.length > 0) {
          setRows(result.rows);
          setPage(result);
          setSelectedPlan(null);
          return;
        }

        const previous = getPreviousIsoWeek(year, week);
        const previousResult = await getProjectManagementPlanPage({
          ...query,
          year: previous.year,
          week: previous.week,
          sectionType: 2,
          limit: 200,
          offset: 0,
        }).catch(() => null);
        if (!active) return;
        const inheritedRows: TargetPlanRow[] = (previousResult?.rows ?? []).map(row => ({
          ...row,
          inherited: true,
          plan: {
            ...row.plan,
            id: -Math.abs(row.plan.id),
            year,
            week,
            sectionType: 1,
            entryType: 0,
            sourcePlanId: row.plan.id,
            resultProgress: null,
            resultNotes: null,
            createdAt: null,
          },
        }));
        setRows(inheritedRows);
        setPage({ ...result, rows: inheritedRows, total: inheritedRows.length, offset: 0, hasMore: false });
        setSelectedPlan(null);
      } catch (exception) {
        if (active) setError(exception instanceof Error ? exception.message : 'Không tải được Task Plan đích.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [queryKey]);

  const customers = useMemo(() => [...new Set(projects.map(project => project.customer).filter(Boolean))].sort(), [projects]);
  const managers = useMemo(() => [...new Set(projects.map(project => project.projectManager).filter(Boolean))].sort(), [projects]);
  const filteredProjects = useMemo(() => sortProjectManagementProjects(projects.filter(project => !customer || project.customer === customer)), [customer, projects]);
  const stats = useMemo(() => ({
    rows: page?.total ?? rows.length,
    projects: new Set(rows.map(row => row.projectRecordId).filter(Boolean)).size,
    result: rows.filter(row => row.plan.resultProgress !== null).length,
    average: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.plan.currentProgress, 0) / rows.length) : 0,
  }), [page?.total, rows]);

  const loadMore = () => {
    if (!page?.hasMore || loadingMore) return;
    setLoadingMore(true);
    void getProjectManagementPlanPage({ ...query, offset: rows.length }).then(result => {
      setRows(current => [...current, ...result.rows]);
      setPage(result);
    }).catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải thêm được Task Plan.')).finally(() => setLoadingMore(false));
  };

  const toggleSort = (field: ProjectManagementPlanSortField) => {
    if (sortField === field) {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortField(field);
    setSortOrder('asc');
  };

  return <section className="local-pm-page target-task-plan-page">
    <div className="page-heading"><div><p className="eyebrow">Target project-management store</p><h2>{mode === 'week' ? 'Task Plan tuần' : 'Danh sách Task Plan'}</h2><p className="muted">Bản đọc-only theo schema target; không ghi vào Jarvis hoặc TFS.</p></div><button type="button" onClick={() => window.location.reload()} disabled={loading || loadingMore}>{loading ? 'Đang tải...' : 'Làm mới'}</button></div>
    <div className="local-pm-banner"><strong>Chế độ kiểm chứng read-only</strong><span>Chỉ hiển thị các dòng `pm_task_plan` active từ `FiinGroupApp.ProjectManagement`. Dữ liệu `FIXTURE-PM-*` nếu có là synthetic/disposable.</span></div>
    <div className="target-task-plan-view-switch"><NavLink className={({ isActive }) => 'btn btn-sm ' + (isActive ? 'btn-primary' : 'btn-outline-secondary')} to="/task-plan-list-local">Danh sách</NavLink><NavLink className={({ isActive }) => 'btn btn-sm ' + (isActive ? 'btn-primary' : 'btn-outline-secondary')} to="/task-plan-local">Task Plan tuần</NavLink></div>
    {mode === 'week' && <div className="target-task-plan-week-header"><button type="button" className="target-task-plan-week-nav" onClick={() => moveWeek(-1)} aria-label="Tuần trước">‹</button><div><span className="card-label">Tuần đang xem</span><strong>{weekLabel(year, week)}</strong><small>{selectedWeekRange ? `${formatCompactDate(selectedWeekRange.start)} → ${formatCompactDate(selectedWeekRange.end)}` : 'Chọn năm và tuần'}</small></div><button type="button" className="target-task-plan-week-nav" onClick={() => moveWeek(1)} aria-label="Tuần sau">›</button><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setYear(currentYear); setWeek(currentWeek); }}>Tuần này</button></div>}
    <div className="target-task-plan-toolbar">
      <label>Năm<select value={year} onChange={event => setYear(Number(event.target.value) || '')}><option value="">Tất cả</option>{[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Tuần<select value={week} onChange={event => setWeek(Number(event.target.value) || '')}><option value="">Tất cả</option>{Array.from({ length: 53 }, (_, index) => index + 1).map(value => <option key={value} value={value}>W{String(value).padStart(2, '0')}</option>)}</select></label>
      <label>Khách hàng<select value={customer} onChange={event => { setCustomer(event.target.value); setProjectId(''); }}><option value="">Tất cả</option>{customers.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Project<select value={projectId} onChange={event => setProjectId(Number(event.target.value) || '')}><option value="">Tất cả</option>{filteredProjects.map(project => <option key={project.id} value={project.id}>{projectManagementProjectLabel(project)}</option>)}</select></label>
      <label>PM<select value={projectManager} onChange={event => { setProjectManager(event.target.value); setProjectId(''); }}><option value="">Tất cả</option>{managers.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Loại<select value={sectionType} onChange={event => setSectionType(Number(event.target.value) || '')}><option value="">Tất cả</option><option value="1">Weekly progress</option><option value="2">Next plan</option></select></label>
      <label>Trạng thái<select value={status} onChange={event => setStatus(event.target.value === '' ? '' : Number(event.target.value))}><option value="">Tất cả</option><option value="1">Hiệu lực</option><option value="9">Đã xóa</option></select></label>
    </div>
    <div className="local-pm-stats target-task-plan-stats"><div><span>Dòng phù hợp</span><strong>{stats.rows}</strong></div><div><span>Project trong trang</span><strong>{stats.projects}</strong></div><div><span>Đã có kết quả</span><strong>{stats.result}</strong></div><div><span>Actual TB trong trang</span><strong>{stats.average}%</strong></div></div>
    {error && <p className="error">{error}</p>}
    {loading ? <div className="local-pm-empty">Đang tải danh sách Task Plan…</div> : !rows.length ? <div className="local-pm-empty">Không có Task Plan phù hợp với bộ lọc hiện tại.</div> : mode === 'week' ? <WeekBoard rows={rows} selectedId={selectedPlan?.plan.id ?? null} onSelect={setSelectedPlan} /> : <section className="platform-card target-task-plan-card"><header><div><span className="card-label">Target read model</span><h3>{rows.length} / {page?.total ?? rows.length} dòng đang hiển thị</h3></div><span className="muted">Bấm một dòng để xem chi tiết</span></header><PlanTable rows={rows} selectedId={selectedPlan?.plan.id ?? null} onSort={toggleSort} sortField={sortField} sortOrder={sortOrder} onSelect={setSelectedPlan} /><footer className="target-task-plan-footer">{page?.hasMore ? <button type="button" className="btn btn-outline-secondary" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Đang tải thêm…' : `Tải thêm (${Math.max(0, (page.total - rows.length))})`}</button> : <span>Đã hiển thị toàn bộ kết quả.</span>}</footer></section>}
    {selectedPlan && <PlanDetail item={selectedPlan} />}
  </section>;
}
