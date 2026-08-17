import { useEffect, useMemo, useState } from 'react';
import {
  getProjectManagementProjects,
  getProjectManagementPmbokWorkspace,
  getProjectManagementWorkspace,
  type ProjectManagementProject,
  type ProjectManagementTaskDetails,
  type ProjectManagementPmbokWorkspace,
  type ProjectManagementWorkspace,
} from './projectManagementClient';
import LocalProjectManagementPmbok from './LocalProjectManagementPmbok';

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value.includes(' ') ? value.replace(' ', 'T') : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function statusLabel(status: number) {
  return ({ 0: 'Chưa bắt đầu', 1: 'Đang thực hiện', 2: 'Tạm dừng', 3: 'Hoàn tất', 9: 'Đã ẩn' } as Record<number, string>)[status] ?? `Mã ${status}`;
}

function roleLabel(role: number) {
  return ({ 1: 'Thực hiện', 2: 'Phối hợp/duyệt', 3: 'Hỗ trợ' } as Record<number, string>)[role] ?? `Vai trò ${role}`;
}

function dependencyLabel(type: number) {
  return ({ 1: 'FS', 2: 'SS', 3: 'FF', 4: 'SF' } as Record<number, string>)[type] ?? `Loại ${type}`;
}

function EmptySection({ text }: { text: string }) {
  return <div className="local-pm-empty">{text}</div>;
}

function TaskDetail({ item, workspace }: { item: ProjectManagementTaskDetails; workspace: ProjectManagementWorkspace }) {
  const taskNames = useMemo(() => new Map(workspace.tasks.map(entry => [entry.task.id, entry.task.taskName])), [workspace.tasks]);
  const task = item.task;
  return <article className="local-pm-task-detail">
    <div className="local-pm-detail-heading"><div><span className="card-label">Task detail</span><h3>{task.taskCode} · {task.taskName}</h3></div><span className="project-status-chip">{statusLabel(task.status)}</span></div>
    <div className="local-pm-detail-grid">
      <div><span>Ngày kế hoạch</span><strong>{formatDate(task.startDate)} → {formatDate(task.endDate)}</strong></div>
      <div><span>Ngày thực tế</span><strong>{formatDate(task.actualStartDate)} → {formatDate(task.actualEndDate)}</strong></div>
      <div><span>Thời lượng</span><strong>{task.duration || '—'} ngày{task.effort === null ? '' : ` · ${task.effort} effort`}</strong></div>
      <div><span>Giai đoạn / vai trò</span><strong>{task.phase || '—'} · {task.departmentRole || '—'}</strong></div>
    </div>
    {task.description && <div className="local-pm-copy-block"><span>Mô tả</span><p>{task.description}</p></div>}
    {task.product && <div className="local-pm-copy-block"><span>Sản phẩm đầu ra</span><p>{task.product}</p></div>}
    <div className="local-pm-detail-list"><span>Người phụ trách</span>{item.assignees.length ? item.assignees.map(assignee => <div key={assignee.id}><strong>{assignee.assignee}</strong><small>{roleLabel(assignee.role)}</small></div>) : <p>Chưa có assignment.</p>}</div>
    <div className="local-pm-detail-list"><span>Phụ thuộc</span>{item.dependencies.length ? item.dependencies.map(dependency => <div key={dependency.id}><strong>{taskNames.get(dependency.dependsOnId) || `Task #${dependency.dependsOnId}`}</strong><small>{dependencyLabel(dependency.dependencyType)}{dependency.lagDays ? ` · lag ${dependency.lagDays} ngày` : ''}</small></div>) : <p>Không có phụ thuộc.</p>}</div>
    <div className="local-pm-copy-block"><span>Lịch sử trường dữ liệu</span>{item.logs.length ? <div className="table-scroll-x"><table className="data-table local-pm-log-table"><thead><tr><th>Thời gian</th><th>Người cập nhật</th><th>Trường</th><th>Thay đổi</th><th>Ghi chú</th></tr></thead><tbody>{item.logs.map(log => <tr key={log.id}><td>{formatDate(log.createdAt)}</td><td>{log.updatedBy}</td><td>{log.fieldName}</td><td>{log.oldValue || '∅'} → {log.newValue || '∅'}</td><td>{log.note || '—'}</td></tr>)}</tbody></table></div> : <p>Chưa có lịch sử.</p>}</div>
    <footer className="local-pm-detail-footer"><span>Read-only target store · không ghi TFS/Jarvis.</span>{task.sourceUrl && <a href={task.sourceUrl} target="_blank" rel="noreferrer">Mở nguồn</a>}</footer>
  </article>;
}

export default function LocalProjectManagementPage() {
  const [projects, setProjects] = useState<ProjectManagementProject[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [workspace, setWorkspace] = useState<ProjectManagementWorkspace | null>(null);
  const [pmbok, setPmbok] = useState<ProjectManagementPmbokWorkspace | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [pmbokLoading, setPmbokLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pmbokError, setPmbokError] = useState<string | null>(null);

  const loadProjects = () => {
    setLoading(true);
    setError(null);
    setPmbok(null);
    setPmbokError(null);
    void getProjectManagementProjects().then(result => {
      setProjects(result);
      setSelectedId(current => current && result.some(project => project.id === current) ? current : result[0]?.id ?? null);
    }).catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được project đích.')).finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    if (!selectedId) {
      setWorkspace(null);
      setPmbok(null);
      return;
    }
    let active = true;
    setWorkspaceLoading(true);
    setError(null);
    setPmbok(null);
    setPmbokError(null);
    setSelectedTaskId(null);
    void getProjectManagementWorkspace(selectedId).then(result => { if (active) setWorkspace(result); }).catch(exception => { if (active) setError(exception instanceof Error ? exception.message : 'Không tải được workspace PM.'); }).finally(() => { if (active) setWorkspaceLoading(false); });
    return () => { active = false; };
  }, [selectedId]);

  const loadPmbok = () => {
    if (!selectedId) return;
    setPmbokLoading(true);
    setPmbokError(null);
    void getProjectManagementPmbokWorkspace(selectedId)
      .then(result => setPmbok(result))
      .catch(exception => setPmbokError(exception instanceof Error ? exception.message : 'Không tải được PMBOK workspace.'))
      .finally(() => setPmbokLoading(false));
  };

  const selectedTask = workspace?.tasks.find(item => item.task.id === selectedTaskId) ?? null;
  const taskNames = useMemo(() => new Map(workspace?.tasks.map(item => [item.task.id, item.task.taskName]) ?? []), [workspace]);
  const taskDepth = useMemo(() => {
    const parentById = new Map((workspace?.tasks ?? []).map(item => [item.task.id, item.task.parentId]));
    const depth = (id: number, seen = new Set<number>()): number => {
      const parent = parentById.get(id);
      if (!parent || seen.has(id)) return 0;
      seen.add(id);
      return 1 + depth(parent, seen);
    };
    return new Map((workspace?.tasks ?? []).map(item => [item.task.id, depth(item.task.id)]));
  }, [workspace]);
  const stats = useMemo(() => {
    const tasks = workspace?.tasks ?? [];
    const progress = tasks.length ? Math.round(tasks.reduce((sum, item) => sum + item.task.progress, 0) / tasks.length) : 0;
    return { tasks: tasks.length, completed: tasks.filter(item => item.task.progress >= 100 || item.task.status === 3).length, progress, dependencies: tasks.reduce((sum, item) => sum + item.dependencies.length, 0), logs: tasks.reduce((sum, item) => sum + item.logs.length, 0) };
  }, [workspace]);

  return <section className="local-pm-page">
    <div className="page-heading"><div><p className="eyebrow">Target project-management store</p><h2>PM nghiệp vụ — dữ liệu đích</h2><p className="muted">WBS, assignment, dependency, lịch sử task, kế hoạch tuần và tổng hợp tiến độ từ schema PM đích.</p></div><button type="button" onClick={loadProjects} disabled={loading || workspaceLoading}>{loading ? 'Đang tải...' : 'Làm mới'}</button></div>
    <div className="local-pm-banner"><strong>Chế độ kiểm chứng read-only</strong><span>Nguồn này chỉ đọc `FiinGroupApp.ProjectManagement`. Nếu dùng fixture, mọi mã `FIXTURE-PM-*` là dữ liệu synthetic; không phải dữ liệu Jarvis và không có mapping TFS.</span></div>
    {error && <p className="error">{error}</p>}
    <div className="local-pm-toolbar"><label htmlFor="localPmProject">Project đích</label><select id="localPmProject" value={selectedId ?? ''} onChange={event => setSelectedId(Number(event.target.value) || null)} disabled={loading || !projects.length}><option value="">— Chọn project —</option>{projects.map(project => <option key={project.id} value={project.id}>{project.projectCode || `#${project.id}`} · {project.customer}</option>)}</select><span className="muted">{projects.length} project đang tracking</span></div>
    {loading && <EmptySection text="Đang tải danh sách project đích…" />}
    {!loading && !projects.length && !error && <EmptySection text="Chưa có project đích. Có thể chạy migration rồi nạp fixture target-only theo runbook." />}
    {workspaceLoading && <EmptySection text="Đang tải toàn bộ workspace PM…" />}
    {workspace && !workspaceLoading && <>
      <div className="local-pm-project-card"><div><span className="card-label">{workspace.project.projectCode || 'Project đích'}</span><h3>{workspace.project.annexName || workspace.project.customer}</h3><p>{workspace.project.customer} · PM: {workspace.project.projectManager} · Trạng thái: {statusLabel(workspace.project.status)}</p></div><div className="local-pm-project-meta"><div><span>Mã phụ lục</span><strong>{workspace.project.annexNo || '—'}</strong></div><div><span>Thời gian</span><strong>{formatDate(workspace.project.startDate)} → {formatDate(workspace.project.endDate)}</strong></div><div><span>Giá trị / ngân sách</span><strong>{formatMoney(workspace.project.amount)} / {formatMoney(workspace.project.budget)}</strong></div></div></div>
      <div className="local-pm-stats"><div><span>Task</span><strong>{stats.tasks}</strong></div><div><span>Hoàn tất</span><strong>{stats.completed}</strong></div><div><span>Tiến độ TB</span><strong>{stats.progress}%</strong></div><div><span>Phụ thuộc</span><strong>{stats.dependencies}</strong></div><div><span>Lịch sử</span><strong>{stats.logs}</strong></div></div>
      <div className="local-pm-grid">
        <section className="platform-card local-pm-section local-pm-wbs"><header><div><span className="card-label">WBS / task</span><h3>Công việc và quan hệ</h3></div><span className="muted">Bấm một dòng để xem chi tiết</span></header>{workspace.tasks.length ? <div className="table-scroll-x"><table className="data-table"><thead><tr><th>Mã</th><th>Công việc</th><th>Giai đoạn</th><th>Kế hoạch</th><th>Tiến độ</th><th>Phụ trách</th><th>Trạng thái</th><th></th></tr></thead><tbody>{workspace.tasks.map(item => <tr key={item.task.id} className={selectedTaskId === item.task.id ? 'selected-row' : ''}><td>{item.task.taskCode}</td><td><button type="button" className="local-pm-task-link" onClick={() => setSelectedTaskId(item.task.id)} style={{ paddingLeft: `${(taskDepth.get(item.task.id) ?? 0) * 18}px` }}><strong>{item.task.taskName}</strong><small>{item.task.parentId ? `Con của ${taskNames.get(item.task.parentId) || `#${item.task.parentId}`}` : item.task.description || '—'}</small></button></td><td>{item.task.phase || '—'}</td><td>{item.task.plan}%<small>{formatDate(item.task.startDate)} → {formatDate(item.task.endDate)}</small></td><td><div className="local-pm-progress"><span><i style={{ width: `${Math.max(0, Math.min(100, item.task.progress))}%` }} /></span><strong>{item.task.progress}%</strong></div></td><td>{item.assignees.length ? item.assignees.map(assignee => <span className="local-pm-chip" key={assignee.id} title={roleLabel(assignee.role)}>{assignee.assignee}</span>) : '—'}</td><td><span className="local-pm-status">{statusLabel(item.task.status)}{item.task.isCritical ? ' · critical' : ''}</span></td><td><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedTaskId(item.task.id)}>Chi tiết</button></td></tr>)}</tbody></table></div> : <EmptySection text="Project chưa có task." />}</section>
        <div className="local-pm-side">{selectedTask ? <TaskDetail item={selectedTask} workspace={workspace} /> : <div className="platform-card local-pm-select-hint"><span className="project-progress-icon">◌</span><h3>Chọn một task</h3><p>Assignment, phụ thuộc và log trường dữ liệu sẽ hiển thị ở đây.</p></div>}</div>
      </div>
      <div className="local-pm-tables"><section className="platform-card local-pm-section"><header><div><span className="card-label">Weekly plan</span><h3>Kế hoạch tuần</h3></div><span className="muted">{workspace.plans.length} dòng</span></header>{workspace.plans.length ? <div className="table-scroll-x"><table className="data-table"><thead><tr><th>Tuần</th><th>Nội dung</th><th>Khoảng thời gian</th><th>Hiện tại</th><th>Kế hoạch</th><th>Kết quả</th><th>Nguồn lực</th></tr></thead><tbody>{workspace.plans.map(plan => <tr key={plan.id}><td>W{plan.week}/{plan.year}</td><td><strong>{plan.taskDescription}</strong><small>{plan.customer || '—'} · {plan.remarks || '—'}</small></td><td>{formatDate(plan.fromDate)} → {formatDate(plan.toDate)}</td><td>{plan.currentProgress}%</td><td>{plan.planProgress}%</td><td>{plan.resultProgress === null ? '—' : `${plan.resultProgress}%`}<small>{plan.resultNotes || ''}</small></td><td>{plan.resource || '—'}</td></tr>)}</tbody></table></div> : <EmptySection text="Chưa có kế hoạch tuần." />}</section>
      <section className="platform-card local-pm-section"><header><div><span className="card-label">Project summary</span><h3>Tổng hợp tiến độ</h3></div><span className="muted">{workspace.summaries.length} dòng</span></header>{workspace.summaries.length ? <div className="table-scroll-x"><table className="data-table"><thead><tr><th>Tuần</th><th>Kế hoạch</th><th>Thực tế</th><th>Thời gian</th><th>Ghi chú</th><th>Nguồn lực</th></tr></thead><tbody>{workspace.summaries.map(summary => <tr key={summary.id}><td>W{summary.week ?? '—'}/{summary.year ?? '—'}</td><td>{summary.planPercent}%</td><td>{summary.actualPercent}%</td><td>{formatDate(summary.startDate)} → {formatDate(summary.endDate)}</td><td>{summary.notes || '—'}</td><td>{summary.resources || '—'}</td></tr>)}</tbody></table></div> : <EmptySection text="Chưa có summary tuần." />}</section></div>
      <div className="local-pm-pmbok-toolbar"><div><span className="card-label">Optional target schema</span><strong>PMBOK sheets</strong><small>Charter, stakeholder, resource/RACI, risk, cost, quality, communication và change log</small></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadPmbok} disabled={pmbokLoading}>{pmbokLoading ? 'Đang tải PMBOK...' : pmbok ? 'Tải lại PMBOK' : 'Mở PMBOK (optional)'}</button></div>
      {pmbokError && <p className="error local-pm-pmbok-error">{pmbokError}</p>}
      {pmbok && <LocalProjectManagementPmbok data={pmbok} />}
    </>}
  </section>;
}
