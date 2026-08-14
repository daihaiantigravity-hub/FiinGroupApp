import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getTfsIterations,
  getTfsProject,
  getTfsProjects,
  getTfsTeams,
  getTfsWorkItem,
  getTfsWorkItems,
  getTfsWorkItemTypes,
  createTfsWorkItem,
  updateTfsWorkItem,
  type TfsIteration,
  type TfsProject,
  type TfsTeam,
  type TfsCreateWorkItemRequest,
  type TfsUpdateWorkItemRequest,
  type TfsWorkItemDetail,
  type TfsWorkItemType,
  type TfsWorkItem,
} from '../auth/tfsProjectClient';

type ProjectSheet = 'overview' | 'teams' | 'iterations' | 'work-items' | 'wbs' | 'charter' | 'stakeholder' | 'resource' | 'cost' | 'risk' | 'quality' | 'communication' | 'change_log';

const sheets: Array<{ key: ProjectSheet; label: string; available: boolean; reason?: string }> = [
  { key: 'overview', label: 'Tổng quan', available: true },
  { key: 'teams', label: 'Teams', available: true },
  { key: 'iterations', label: 'Iterations', available: true },
  { key: 'work-items', label: 'Work items', available: true },
  { key: 'wbs', label: 'WBS', available: true },
  { key: 'charter', label: 'Charter', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'stakeholder', label: 'Stakeholder', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'resource', label: 'Resource & RACI', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'cost', label: 'Cost & Budget', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'risk', label: 'Risk', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'quality', label: 'Quality', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'communication', label: 'Communication', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'change_log', label: 'Change Log', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
];

const jarvisManagementSheets: Array<{ key: ProjectSheet; label: string; available: boolean; reason?: string }> = [
  { key: 'overview', label: 'Tổng quan', available: true },
  { key: 'charter', label: 'Charter', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'stakeholder', label: 'Stakeholder', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'wbs', label: 'WBS', available: true },
  { key: 'resource', label: 'Resource & RACI', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'cost', label: 'Cost & Budget', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'risk', label: 'Risk', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'quality', label: 'Quality', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'communication', label: 'Communication', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
  { key: 'change_log', label: 'Change Log', available: false, reason: 'Chờ nguồn dữ liệu Jarvis DB.' },
];

function LoadingState({ text }: { text: string }) {
  return <p className="muted project-state">{text}</p>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="muted project-empty">{text}</p>;
}

function parseTfsDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatTfsDate(value: Date) {
  return value.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function formatTaskDate(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type ToolMenuIconKind = 'sync' | 'critical' | 'baseline' | 'history' | 'export' | 'refresh';

function ToolMenuIcon({ kind }: { kind: ToolMenuIconKind }) {
  if (kind === 'sync') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></svg>;
  if (kind === 'critical') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
  if (kind === 'baseline') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>;
  if (kind === 'history') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  if (kind === 'export') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>;
}

function TfsTaskCreateModal({ project, workItems, item, onClose, onCreated }: { project: TfsProject; workItems: TfsWorkItem[]; item?: TfsWorkItemDetail; onClose: () => void; onCreated: (item: TfsWorkItemDetail) => void }) {
  const [form, setForm] = useState<TfsCreateWorkItemRequest>(() => item ? { workItemType: item.workItemType ?? 'Task', title: item.title ?? '', description: item.description ?? '', priority: item.priorityCode || 2, assignedTo: item.assignedTo ?? '', iterationPath: item.iterationPath ?? '', startDate: item.startDate?.slice(0, 10), finishDate: item.finishDate?.slice(0, 10), tags: item.tags ?? '', parentId: item.parentId ?? undefined } : { workItemType: 'Task', title: '', priority: 2 });
  const [workItemTypes, setWorkItemTypes] = useState<TfsWorkItemType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assignees = [...new Set(workItems.map(item => item.assignedTo).filter((value): value is string => Boolean(value)))].sort();
  useEffect(() => {
    let active = true;
    void getTfsWorkItemTypes(project).then(types => { if (active) setWorkItemTypes(types); }).catch(() => { if (active) setWorkItemTypes([]); });
    return () => { active = false; };
  }, [project]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) { setError('Vui lòng nhập tên công việc.'); return; }
    setSaving(true); setError(null);
    try {
      const saved = item
        ? await updateTfsWorkItem(project, item.id, { ...form, title: form.title.trim(), revision: item.revision } as TfsUpdateWorkItemRequest)
        : await createTfsWorkItem(project, { ...form, title: form.title.trim() });
      onCreated(saved);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tạo work item trên TFS.');
    } finally { setSaving(false); }
  }
  const update = (field: keyof TfsCreateWorkItemRequest, value: string | number | undefined) => setForm(previous => ({ ...previous, [field]: value }));
  return <div className="work-item-modal" role="dialog" aria-modal="true" aria-labelledby="create-work-item-title">
    <button type="button" className="work-item-modal-backdrop" aria-label="Đóng form tạo task" onClick={onClose} />
    <form className="work-item-modal-panel tfs-create-task-panel" onSubmit={submit}>
      <header><div><p className="eyebrow">TFS Work Item · {project.name}</p><h3 id="create-work-item-title">{item ? 'Sửa Task' : 'Thêm Task mới'}</h3></div><button type="button" className="work-item-modal-close" onClick={onClose} aria-label="Đóng">×</button></header>
      <div className="tfs-create-task-grid">
        <label className="tfs-create-task-wide">Tên công việc <span className="required">*</span><input value={form.title} onChange={event => update('title', event.target.value)} autoFocus maxLength={250} /></label>
        <label>Loại Work Item{workItemTypes.length > 0 ? <select value={form.workItemType ?? workItemTypes[0].name} onChange={event => update('workItemType', event.target.value)}>{workItemTypes.map(type => <option key={type.name} value={type.name}>{type.name}</option>)}</select> : <input value={form.workItemType ?? 'Task'} onChange={event => update('workItemType', event.target.value)} />}</label>
        <label>Độ ưu tiên<select value={form.priority ?? 2} onChange={event => update('priority', Number(event.target.value))}><option value="1">Thấp</option><option value="2">Trung bình</option><option value="3">Cao</option><option value="4">Khẩn cấp</option></select></label>
        <label>Người thực hiện<input list="tfs-create-assignees" value={form.assignedTo ?? ''} onChange={event => update('assignedTo', event.target.value)} /><datalist id="tfs-create-assignees">{assignees.map(value => <option key={value} value={value} />)}</datalist></label>
        <label>Iteration Path<input value={form.iterationPath ?? ''} onChange={event => update('iterationPath', event.target.value)} placeholder={project.name} /></label>
        <label>Ngày bắt đầu<input type="date" value={form.startDate ?? ''} onChange={event => update('startDate', event.target.value)} /></label>
        <label>Ngày kết thúc<input type="date" value={form.finishDate ?? ''} onChange={event => update('finishDate', event.target.value)} /></label>
        <label>Task cha<select value={form.parentId ?? ''} onChange={event => update('parentId', event.target.value ? Number(event.target.value) : undefined)}><option value="">-- Không có --</option>{workItems.map(item => <option key={item.id} value={item.id}>#{item.id} {item.title || '(Không có tiêu đề)'}</option>)}</select></label>
        <label className="tfs-create-task-wide">Tags<input value={form.tags ?? ''} onChange={event => update('tags', event.target.value)} placeholder="tag1; tag2" /></label>
        <label className="tfs-create-task-wide">Mô tả<textarea rows={4} value={form.description ?? ''} onChange={event => update('description', event.target.value)} maxLength={5000} /></label>
      </div>
      {error && <p className="error">{error}</p>}
      <footer><span className="muted">Dữ liệu sẽ được tạo trực tiếp trên TFS; không ghi vào Jarvis DB.</span><button type="button" className="btn btn-tools" onClick={onClose} disabled={saving}>Hủy</button><button type="submit" className="source-add-task" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu Task'}</button></footer>
    </form>
  </div>;
}

type TfsPageKind = 'browser' | 'management' | 'tasks';
const projectManagementStorageKey = 'projectmanagement.lastProject';

export default function TfsProjectsPage({ initialSheet = 'overview', pageKind = 'browser' }: { initialSheet?: ProjectSheet; pageKind?: TfsPageKind }) {
  const targetMode = (import.meta.env.VITE_AUTH_MODE ?? 'legacy') === 'target-dev';
  const progressMode = pageKind === 'tasks' || initialSheet === 'wbs';
  const [projects, setProjects] = useState<TfsProject[]>([]);
  const [selected, setSelected] = useState<TfsProject | null>(null);
  const [activeSheet, setActiveSheet] = useState<ProjectSheet>(initialSheet);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<TfsTeam[]>([]);
  const [iterations, setIterations] = useState<TfsIteration[]>([]);
  const [workItems, setWorkItems] = useState<TfsWorkItem[]>([]);
  const [workItemTotal, setWorkItemTotal] = useState(0);
  const [workItemOffset, setWorkItemOffset] = useState(0);
  const [loadedSheets, setLoadedSheets] = useState<Set<ProjectSheet>>(new Set());
  const [dataLoading, setDataLoading] = useState<ProjectSheet | null>(null);
  const [workItemDetail, setWorkItemDetail] = useState<TfsWorkItemDetail | null>(null);
  const [workItemDetailLoading, setWorkItemDetailLoading] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editTask, setEditTask] = useState<TfsWorkItemDetail | null>(null);
  const [deleteTask, setDeleteTask] = useState<TfsWorkItem | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const taskGridRef = useRef<HTMLDivElement>(null);
  const [taskGridScroll, setTaskGridScroll] = useState({ left: false, right: false });
  const [wbsSearch, setWbsSearch] = useState('');
  const [wbsState, setWbsState] = useState('all');
  const [wbsIteration, setWbsIteration] = useState('all');
  const [wbsPriority, setWbsPriority] = useState('all');
  const [wbsAssignee, setWbsAssignee] = useState('all');
  const [progressView, setProgressView] = useState<string>('list');
  const [ganttCellWidth, setGanttCellWidth] = useState(30);
  const projectRequestRef = useRef(0);

  useEffect(() => {
    if (!toolsOpen && !workItemDetail && !notice && !deleteTask) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (toolsOpen && target instanceof Element && !target.closest('.pm-tools')) setToolsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setToolsOpen(false);
      setWorkItemDetail(null);
      setNotice(null);
      setDeleteTask(null);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteTask, notice, toolsOpen, workItemDetail]);

  useEffect(() => {
    const node = taskGridRef.current;
    if (!node) return;

    const updateScrollState = () => {
      const maxScrollLeft = Math.max(0, node.scrollWidth - node.clientWidth);
      setTaskGridScroll({
        left: node.scrollLeft > 0,
        right: node.scrollLeft < maxScrollLeft - 1,
      });
    };

    updateScrollState();
    node.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      node.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [loading, progressView, selected, workItems.length]);

  const collections = useMemo(() => {
    const grouped = new Map<string, TfsProject[]>();
    for (const project of projects) {
      grouped.set(project.collection, [...(grouped.get(project.collection) ?? []), project]);
    }
    return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [projects]);

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      setProjects(await getTfsProjects());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách dự án TFS.');
    } finally {
      setLoading(false);
    }
  }

  function showBoundaryNotice(title: string, message: string) {
    setToolsOpen(false);
    setNotice({ title, message });
  }

  function clearProjectSelection() {
    projectRequestRef.current += 1;
    if (pageKind === 'management') {
      try {
        window.localStorage.removeItem(projectManagementStorageKey);
      } catch {
        // Project selection persistence is optional.
      }
    }
    setSelected(null);
    setActiveSheet(initialSheet);
    setError(null);
    setDetailLoading(false);
    setDataLoading(null);
    setTeams([]);
    setIterations([]);
    setWorkItems([]);
    setWorkItemTotal(0);
    setWorkItemOffset(0);
    setLoadedSheets(new Set());
    setWorkItemDetail(null);
    setWorkItemDetailLoading(false);
    setCreateTaskOpen(false);
    setEditTask(null);
    setDeleteTask(null);
    setWbsSearch('');
    setWbsState('all');
    setWbsIteration('all');
    setWbsPriority('all');
    setWbsAssignee('all');
    setProgressView('list');
    setToolsOpen(false);
  }

  useEffect(() => {
    if (targetMode) void loadProjects();
    else setLoading(false);
  }, [targetMode]);

  useEffect(() => {
    if (!targetMode || pageKind !== 'management' || selected || projects.length === 0) return;
    try {
      const savedProjectKey = window.localStorage.getItem(projectManagementStorageKey);
      const savedProject = projects.find(project => project.collection + '/' + project.id === savedProjectKey);
      if (savedProject) void selectProject(savedProject);
    } catch {
      // Project selection persistence is optional and must not block TFS loading.
    }
  }, [pageKind, projects, selected, targetMode]);

  async function selectProject(project: TfsProject) {
    const requestId = ++projectRequestRef.current;
    if (pageKind === 'management') {
      try {
        window.localStorage.setItem(projectManagementStorageKey, project.collection + '/' + project.id);
      } catch {
        // Project selection persistence is optional.
      }
    }
    setSelected(project);
    setActiveSheet(initialSheet);
    setDetailLoading(true);
    setDataLoading(null);
    setError(null);
    setTeams([]);
    setIterations([]);
    setWorkItems([]);
    setWorkItemTotal(0);
    setWorkItemOffset(0);
    setWorkItemDetail(null);
    setLoadedSheets(new Set());
    setWbsSearch('');
    setWbsState('all');
    setWbsIteration('all');
    setWbsPriority('all');
    setWbsAssignee('all');
    setProgressView('list');
    setGanttCellWidth(30);
    setWorkItemDetailLoading(false);
    setCreateTaskOpen(false);
    setEditTask(null);
    setDeleteTask(null);
    try {
      const projectDetail = await getTfsProject(project);
      if (requestId !== projectRequestRef.current) return;
      setSelected(projectDetail);
      if (progressMode || pageKind === 'management') {
        setDataLoading('work-items');
        if (pageKind === 'management') {
          const [teamResult, workItemResult] = await Promise.all([
            getTfsTeams(projectDetail),
            getTfsWorkItems(projectDetail, 100, 0),
          ]);
          if (requestId !== projectRequestRef.current) return;
          setTeams(teamResult);
          setWorkItems(workItemResult.items);
          setWorkItemTotal(workItemResult.totalAvailable);
          setWorkItemOffset(workItemResult.items.length);
          setLoadedSheets(previous => new Set(previous).add('teams').add('work-items'));
        } else {
          const result = await getTfsWorkItems(projectDetail, 100, 0);
          if (requestId !== projectRequestRef.current) return;
          setWorkItems(result.items);
          setWorkItemTotal(result.totalAvailable);
          setWorkItemOffset(result.items.length);
          setLoadedSheets(previous => new Set(previous).add('work-items'));
        }
        setDataLoading(null);
      }
    } catch (reason) {
      if (requestId !== projectRequestRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể tải thông tin chi tiết dự án.');
      setDataLoading(null);
    } finally {
      if (requestId === projectRequestRef.current) setDetailLoading(false);
    }
  }

  type TfsDataSheet = 'teams' | 'iterations' | 'work-items';

  async function loadProjectData(kind: TfsDataSheet) {
    if (!selected || dataLoading !== null) return;
    const requestId = projectRequestRef.current;
    const projectKey = selected.collection + '/' + selected.id;
    setDataLoading(kind);
    setError(null);
    try {
      if (kind === 'teams') {
        const result = await getTfsTeams(selected);
        if (requestId !== projectRequestRef.current || projectKey !== selected.collection + '/' + selected.id) return;
        setTeams(result);
      }
      if (kind === 'iterations') {
        const result = await getTfsIterations(selected);
        if (requestId !== projectRequestRef.current || projectKey !== selected.collection + '/' + selected.id) return;
        setIterations(result);
      }
      if (kind === 'work-items') {
        const result = await getTfsWorkItems(selected, 100, 0);
        if (requestId !== projectRequestRef.current || projectKey !== selected.collection + '/' + selected.id) return;
        setWorkItems(result.items);
        setWorkItemTotal(result.totalAvailable);
        setWorkItemOffset(result.items.length);
      }
      if (requestId === projectRequestRef.current) setLoadedSheets(previous => new Set(previous).add(kind));
    } catch (reason) {
      if (requestId !== projectRequestRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu dự án TFS.');
    } finally {
      if (requestId === projectRequestRef.current) setDataLoading(null);
    }
  }

  async function loadMoreWorkItems() {
    if (!selected || dataLoading !== null || workItemOffset >= workItemTotal) return;
    const requestId = projectRequestRef.current;
    const projectKey = selected.collection + '/' + selected.id;
    setDataLoading('work-items');
    setError(null);
    try {
      const result = await getTfsWorkItems(selected, 100, workItemOffset);
      if (requestId !== projectRequestRef.current || projectKey !== selected.collection + '/' + selected.id) return;
      setWorkItems(previous => [...previous, ...result.items]);
      setWorkItemTotal(result.totalAvailable);
      setWorkItemOffset(previous => previous + result.items.length);
    } catch (reason) {
      if (requestId !== projectRequestRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể tải thêm work items từ TFS.');
    } finally {
      if (requestId === projectRequestRef.current) setDataLoading(null);
    }
  }

  async function openWorkItem(workItemId: number) {
    if (!selected || workItemDetailLoading) return;
    const requestId = projectRequestRef.current;
    const projectKey = selected.collection + '/' + selected.id;
    setWorkItemDetailLoading(true);
    setError(null);
    try {
      const detail = await getTfsWorkItem(selected, workItemId);
      if (requestId !== projectRequestRef.current || projectKey !== selected.collection + '/' + selected.id) return;
      setWorkItemDetail(detail);
    } catch (reason) {
      if (requestId !== projectRequestRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể tải chi tiết work item.');
    } finally {
      if (requestId === projectRequestRef.current) setWorkItemDetailLoading(false);
    }
  }

  async function openEditTask(workItemId: number) {
    if (!selected || workItemDetailLoading) return;
    setWorkItemDetailLoading(true);
    setError(null);
    try {
      setEditTask(await getTfsWorkItem(selected, workItemId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải chi tiết work item.');
    } finally {
      setWorkItemDetailLoading(false);
    }
  }

  function LoadMoreButton() {
    if (workItemOffset >= workItemTotal) return null;
    return <button type="button" className="project-load-more" onClick={() => void loadMoreWorkItems()} disabled={dataLoading !== null}>{dataLoading === 'work-items' ? 'Đang tải...' : `Tải thêm (${workItemTotal - workItemOffset})`}</button>;
  }

  function renderSourceGantt() {
    if (workItems.length === 0) return <EmptyState text="Chưa có task để dựng Gantt." />;
    if (!ganttRange || ganttDays.length === 0) return <EmptyState text="TFS chưa trả về ngày bắt đầu/kết thúc cho các task đã tải." />;
    const dayMs = 24 * 60 * 60 * 1000;
    const startMs = ganttDays[0].getTime();
    const totalWidth = ganttDays.length * ganttCellWidth;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOffset = (today.getTime() - startMs) / dayMs;
    const statusLabels = ['Chưa bắt đầu', 'Đang thực hiện', 'Tạm dừng', 'Hoàn thành'];
    return <div className="source-gantt-container"><div className="gantt-controls source-gantt-controls"><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setGanttCellWidth(value => Math.max(15, value - 10))} title="Thu nhỏ">−</button><span className="zoom-level">{ganttCellWidth <= 20 ? 'Ngày' : ganttCellWidth >= 50 ? 'Tháng' : 'Tuần'}</span><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setGanttCellWidth(value => Math.min(60, value + 10))} title="Phóng to">+</button><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => document.getElementById('source-gantt-today')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })} title="Hôm nay">Hôm nay</button></div><div className="source-gantt-scroll"><div className="source-gantt-header" style={{ width: 240 + totalWidth }}><div className="source-gantt-label-header">Công việc</div><div className="source-gantt-timeline"><div className="source-gantt-months">{ganttMonths.map(month => <div key={month.key} style={{ width: month.days * ganttCellWidth }}>{month.label}</div>)}</div><div className="source-gantt-days">{ganttDays.map(day => <div key={day.toISOString()} className={day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''} style={{ width: ganttCellWidth }}>{day.getDate()}</div>)}</div></div></div><div className="source-gantt-body" style={{ width: 240 + totalWidth }}>{todayOffset >= 0 && todayOffset <= ganttDays.length && <span id="source-gantt-today" className="source-gantt-today" style={{ left: 240 + todayOffset * ganttCellWidth }} />}{filteredWbsItems.map(item => { const start = parseTfsDate(item.startDate); const end = parseTfsDate(item.finishDate || item.targetDate || item.closedDate) || start; const startOffset = start ? Math.max(0, (start.getTime() - startMs) / dayMs) : 0; const duration = start && end ? Math.max(1, (end.getTime() - start.getTime()) / dayMs + 1) : 0; const status = item.statusCode >= 0 && item.statusCode < statusLabels.length ? statusLabels[item.statusCode] : (item.state || '—'); return <div className="source-gantt-row" key={item.id}><div className="source-gantt-task-label"><strong style={{ paddingLeft: item.parentId ? '1rem' : undefined }}>{item.parentId ? '↳ ' : ''}{item.taskCode || 'TFS-' + item.id} · {item.title || '(Không có tiêu đề)'}</strong><small>{status} · {item.progress}%</small></div><div className="source-gantt-track" style={{ width: totalWidth }}>{ganttDays.map(day => <span key={day.toISOString()} className={day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''} style={{ width: ganttCellWidth }} />)}{duration > 0 && <span className={'source-gantt-bar' + (item.statusCode === 3 ? ' completed' : '')} style={{ left: startOffset * ganttCellWidth, width: duration * ganttCellWidth }} title={`${item.taskCode || 'TFS-' + item.id}: ${status}`}><i style={{ width: item.progress + '%' }} /></span>}</div></div>; })}</div></div></div>;
  }

  function renderSourceTaskGrid() {
    if (dataLoading === 'work-items') return <LoadingState text="Đang tải danh sách task từ TFS…" />;
    const statusLabels = ['Chưa bắt đầu', 'Đang thực hiện', 'Tạm dừng', 'Hoàn thành'];
    const priorityLabels = ['', 'Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'];
    const emptyText = selected ? (filteredWbsItems.length === 0 ? 'Chưa có task nào' : '') : 'Vui lòng chọn dự án để xem danh sách task';
    const scrollTasks = (amount: number) => taskGridRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
    return <div className="table-wrapper source-task-grid"><button type="button" className="scroll-btn scroll-btn-left" onClick={() => scrollTasks(-620)} disabled={!taskGridScroll.left} title="Cuộn trái" aria-label="Cuộn trái">‹</button><div ref={taskGridRef} className="table-scroll-x source-task-grid-scroll"><table className="data-table project-tasks-table"><thead><tr><th className="col-sticky-left">STT</th><th>Mã</th><th>Tên công việc</th><th>Sản phẩm</th><th>Người thực hiện</th><th>Bắt đầu</th><th>Kết thúc</th><th>Tiến độ</th><th>Plan</th><th>Trạng thái</th><th>Ưu tiên</th><th>Người tạo</th><th className="col-sticky-right">Thao tác</th></tr></thead><tbody>{emptyText ? <tr><td colSpan={13} className="text-center text-muted py-4">{emptyText}</td></tr> : filteredWbsItems.map((item, index) => { const endDate = item.finishDate || item.targetDate || item.closedDate; const status = item.statusCode >= 0 && item.statusCode < statusLabels.length ? statusLabels[item.statusCode] : (item.state || '—'); const generated = item.generatedFields || {}; return <tr key={item.id}><td className="col-sticky-left text-center">{index + 1}</td><td>{item.taskCode || 'TFS-' + item.id}</td><td><div className="task-name-cell" style={{ paddingLeft: item.parentId ? '1.25rem' : undefined }}><span>{item.parentId ? '↳ ' : ''}{item.title || '(Không có tiêu đề)'}</span></div></td><td>{item.product || '—'}</td><td>{item.assignedTo || '—'}</td><td className="text-center" title={generated.startDate}>{formatTaskDate(item.startDate)}</td><td className="text-center" title={generated.finishDate}>{formatTaskDate(endDate)}</td><td title={generated.progress}><div className="progress-cell"><div className="progress-bar-wrapper"><div className="progress-bar-fill" style={{ width: item.progress + '%' }} /></div><span className="progress-text">{Math.round(item.progress)}%</span></div></td><td title={generated.plan}><div className="progress-cell"><div className="progress-bar-wrapper"><div className="progress-bar-fill" style={{ width: item.plan + '%', background: '#17a2b8' }} /></div><span className="progress-text">{Math.round(item.plan)}%</span></div></td><td><span className={'status-badge status-' + item.statusCode}>{status}</span></td><td><span className={'priority-badge priority-badge-' + item.priorityCode}>{priorityLabels[item.priorityCode] || 'Trung bình'}</span></td><td>{item.createdBy || '—'}</td><td className="col-sticky-right"><button type="button" className="project-work-item-link" onClick={() => void openWorkItem(item.id)}>Xem</button><button type="button" className="project-work-item-action" onClick={() => void openEditTask(item.id)} title="Sửa Task">Sửa</button><button type="button" className="project-work-item-action danger" onClick={() => setDeleteTask(item)} title="Xóa Task">Xóa</button></td></tr>; })}</tbody></table>{workItems.length > 0 && <><small className="muted project-table-note">Hiển thị {filteredWbsItems.length} / {workItemTotal} work items từ TFS. Tạo và sửa có kiểm soát; xóa chưa được bật.</small><LoadMoreButton /></>}</div><button type="button" className="scroll-btn scroll-btn-right" onClick={() => scrollTasks(620)} disabled={!taskGridScroll.right} title="Cuộn phải" aria-label="Cuộn phải">›</button></div>;
  }

  function changeSheet(sheet: ProjectSheet) {
    if (!selected) {
      showBoundaryNotice('Chọn dự án trước', 'Vui lòng chọn dự án trước khi mở sheet này.');
      return;
    }
    const sheetList = pageKind === 'management' ? jarvisManagementSheets : sheets;
    const targetSheet = sheetList.find(item => item.key === sheet);
    if (!targetSheet?.available) {
      showBoundaryNotice(targetSheet?.label ?? 'Sheet chưa khả dụng', targetSheet?.reason ?? 'Nguồn dữ liệu cho sheet này chưa được chuyển đổi.');
      return;
    }
    setActiveSheet(sheet);
    if (sheet === 'teams' || sheet === 'iterations' || sheet === 'work-items' || sheet === 'wbs') {
      const dataSheet: TfsDataSheet = sheet === 'wbs' ? 'work-items' : sheet;
      if (!loadedSheets.has(dataSheet)) void loadProjectData(dataSheet);
    }
  }

  const wbsIterations = useMemo(() => [...new Set(workItems.map(item => item.iterationPath || 'Chưa phân loại'))].sort((left, right) => left.localeCompare(right)), [workItems]);
  const wbsStates = useMemo(() => [...new Set(workItems.map(item => item.state || 'Không xác định'))].sort((left, right) => left.localeCompare(right)), [workItems]);
  const wbsAssignees = useMemo(() => [...new Set(workItems.map(item => item.assignedTo || '—'))].sort((left, right) => left.localeCompare(right)), [workItems]);
  const filteredWbsItems = useMemo(() => {
    const search = wbsSearch.trim().toLocaleLowerCase();
    return workItems.filter(item => {
      const iteration = item.iterationPath || 'Chưa phân loại';
      const state = item.state || 'Không xác định';
      const matchesSearch = !search || [String(item.id), item.title, item.workItemType, item.assignedTo, iteration].some(value => value?.toLocaleLowerCase().includes(search));
      return matchesSearch && (wbsState === 'all' || state === wbsState) && (wbsIteration === 'all' || iteration === wbsIteration) && (wbsPriority === 'all' || String(item.priorityCode) === wbsPriority) && (wbsAssignee === 'all' || (item.assignedTo || '—') === wbsAssignee);
    });
  }, [workItems, wbsSearch, wbsState, wbsIteration, wbsPriority, wbsAssignee]);
  const wbsStats = useMemo(() => {
    const completed = workItems.filter(item => item.statusCode === 3).length;
    const inProgress = workItems.filter(item => item.statusCode === 1).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = workItems.filter(item => {
      if (item.statusCode === 3) return false;
      const end = parseTfsDate(item.finishDate || item.targetDate || item.closedDate);
      return end !== null && end < today;
    }).length;
    const progress = workItems.length > 0
      ? Math.round(workItems.reduce((sum, item) => sum + (item.progress || 0), 0) / workItems.length)
      : 0;
    return { total: workItems.length, completed, inProgress, overdue, progress };
  }, [workItems]);
  const ganttRange = useMemo(() => {
    const dates = filteredWbsItems.flatMap(item => [parseTfsDate(item.startDate), parseTfsDate(item.finishDate || item.targetDate || item.closedDate)]).filter((value): value is Date => value !== null);
    if (dates.length === 0) return null;
    const start = new Date(Math.min(...dates.map(value => value.getTime())));
    const end = new Date(Math.max(...dates.map(value => value.getTime())));
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 14);
    return { start, end, span: Math.max(1, end.getTime() - start.getTime()) };
  }, [filteredWbsItems]);
  const ganttDays = useMemo(() => {
    if (!ganttRange) return [];
    const days: Date[] = [];
    const cursor = new Date(ganttRange.start);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(ganttRange.end);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [ganttRange]);
  const ganttMonths = useMemo(() => {
    const months: Array<{ key: string; label: string; days: number }> = [];
    for (const day of ganttDays) {
      const key = `${day.getFullYear()}-${day.getMonth()}`;
      const current = months[months.length - 1];
      if (!current || current.key !== key) months.push({ key, label: day.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }), days: 1 });
      else current.days += 1;
    }
    return months;
  }, [ganttDays]);

  function renderSheetContent() {
    if (!selected) return <EmptyState text="Chọn một dự án để xem nội dung quản lý dự án." />;
    if (detailLoading) return <LoadingState text="Đang tải thông tin dự án từ TFS..." />;
    const activeDataSheet = activeSheet === 'wbs' ? 'work-items' : activeSheet;
    if (dataLoading === activeDataSheet) return <LoadingState text={'Đang tải ' + activeSheet + ' từ TFS...'} />;

    if (activeSheet === 'overview') {
      return <div className="project-overview-grid">
        <article className="project-metric"><span>Collection</span><strong>{selected.collection}</strong></article>
        <article className="project-metric"><span>Trạng thái</span><strong>{selected.state ?? 'Không xác định'}</strong></article>
        <article className="project-metric"><span>Teams</span><strong>{loadedSheets.has('teams') ? teams.length : '—'}</strong></article>
        <article className="project-metric"><span>Work items</span><strong>{loadedSheets.has('work-items') ? workItemTotal : '—'}</strong></article>
      </div>;
    }

    if (activeSheet === 'teams') {
      if (dataLoading === 'teams') return <LoadingState text="Đang tải teams từ TFS…" />;
      return <div className="source-data-sheet"><div className="source-data-sheet-head"><div><strong>Teams</strong><span>Danh sách team thuộc project đang chọn từ TFS.</span></div><button type="button" className="btn btn-tools btn-sm" onClick={() => void loadProjectData('teams')} disabled={dataLoading !== null}>Làm mới</button></div>{teams.length === 0 ? <EmptyState text="TFS không trả về team nào cho dự án này." /> : <div className="project-table-wrap"><table className="project-table"><thead><tr><th>Team</th><th>Mô tả</th><th>URL</th></tr></thead><tbody>{teams.map(team => <tr key={team.id}><td><strong>{team.name}</strong><small>{team.id}</small></td><td>{team.description || '—'}</td><td className="break-all">{team.url || '—'}</td></tr>)}</tbody></table><small className="muted project-table-note">Hiển thị {teams.length} team. Dữ liệu đọc-only từ TFS.</small></div>}</div>;
    }

    if (activeSheet === 'iterations') {
      if (dataLoading === 'iterations') return <LoadingState text="Đang tải iterations từ TFS…" />;
      return <div className="source-data-sheet"><div className="source-data-sheet-head"><div><strong>Iterations</strong><span>Iteration path và time frame do TFS trả về.</span></div><button type="button" className="btn btn-tools btn-sm" onClick={() => void loadProjectData('iterations')} disabled={dataLoading !== null}>Làm mới</button></div>{iterations.length === 0 ? <EmptyState text="TFS không trả về iteration nào cho dự án này." /> : <div className="project-table-wrap"><table className="project-table"><thead><tr><th>Iteration</th><th>Path</th><th>Time frame</th></tr></thead><tbody>{iterations.map(iteration => <tr key={iteration.id}><td><strong>{iteration.name}</strong><small>{iteration.id}</small></td><td>{iteration.path || '—'}</td><td>{iteration.timeFrame || '—'}</td></tr>)}</tbody></table><small className="muted project-table-note">Hiển thị {iterations.length} iteration. Dữ liệu đọc-only từ TFS.</small></div>}</div>;
    }

    if (activeSheet === 'work-items') {
      if (dataLoading === 'work-items') return <LoadingState text="Đang tải work items từ TFS…" />;
      return <div className="source-data-sheet"><div className="source-data-sheet-head"><div><strong>Work items</strong><span>Work item đọc-only trong phạm vi truy vấn hiện tại.</span></div><button type="button" className="btn btn-tools btn-sm" onClick={() => void loadProjectData('work-items')} disabled={dataLoading !== null}>Làm mới</button></div>{workItems.length === 0 ? <EmptyState text="Không có work item trong phạm vi truy vấn hiện tại." /> : <div className="project-table-wrap"><table className="project-table"><thead><tr><th>ID</th><th>Tiêu đề</th><th>Loại</th><th>Trạng thái</th><th>Assigned to</th></tr></thead><tbody>{workItems.map(item => <tr key={item.id}><td><button type="button" className="project-work-item-link" onClick={() => void openWorkItem(item.id)}>#{item.id}</button></td><td>{item.title || '(Không có tiêu đề)'}</td><td>{item.workItemType || '—'}</td><td><span className="project-status-chip">{item.state || '—'}</span></td><td>{item.assignedTo || '—'}</td></tr>)}</tbody></table><small className="muted project-table-note">Hiển thị {workItems.length} / {workItemTotal} work items. Đây là dữ liệu đọc-only từ TFS.</small><LoadMoreButton /></div>}</div>;
    }

    if (activeSheet === 'wbs' && progressView === 'gantt') return renderSourceGantt();

    if (activeSheet === 'wbs' && progressView === 'legacy-gantt') return workItems.length === 0
      ? <EmptyState text="Không có work item để dựng Gantt trong phạm vi truy vấn hiện tại." />
      : !ganttRange
        ? <EmptyState text="TFS chưa trả về ngày bắt đầu/kết thúc cho các work item đã tải nên chưa thể dựng Gantt." />
        : <div><div className="project-wbs-controls"><div className="project-view-toggle"><button type="button" className="project-view-tab" onClick={() => setProgressView('list')}>Danh sách</button><button type="button" className="active">Gantt</button></div><span className="muted project-gantt-readonly">Chỉ hiển thị các work item có ngày TFS.</span></div><div className="project-gantt"><div className="project-gantt-scale"><span>{formatTfsDate(ganttRange.start)}</span><span>{formatTfsDate(ganttRange.end)}</span></div>{filteredWbsItems.map(item => { const start = parseTfsDate(item.startDate); const end = parseTfsDate(item.finishDate || item.targetDate || item.closedDate) || start; if (!start || !end) return <div className="project-gantt-row" key={item.id}><div className="project-gantt-label"><strong>#{item.id} {item.title || '(Không có tiêu đề)'}</strong><small>Chưa đủ ngày để vẽ</small></div><div className="project-gantt-track" /></div>; const left = Math.max(0, Math.min(100, ((start.getTime() - ganttRange.start.getTime()) / ganttRange.span) * 100)); const width = Math.max(1.5, Math.min(100 - left, ((end.getTime() - start.getTime()) / ganttRange.span) * 100)); return <div className="project-gantt-row" key={item.id}><div className="project-gantt-label"><strong>#{item.id} {item.title || '(Không có tiêu đề)'}</strong><small>{item.iterationPath || 'Chưa phân loại'} · {item.state || '—'} · {item.progress}%</small></div><div className="project-gantt-track"><span className="project-gantt-bar" style={{ left: left + '%', width: width + '%' }} title={(item.title || 'Work item') + ' · ' + formatTfsDate(start) + ' - ' + formatTfsDate(end) + ' · Tiến độ: ' + item.progress + '%'} /></div></div>; })}</div></div>;

    if (activeSheet === 'wbs') return workItems.length === 0
      ? <EmptyState text="Không có work item để dựng WBS trong phạm vi truy vấn hiện tại." />
      : <div><div className="project-wbs-note"><strong>WBS đọc-only từ TFS</strong><span>Phân nhóm theo Iteration Path và hiển thị quan hệ task cha khi TFS cung cấp System.Parent.</span></div><div className="project-wbs-stats"><article><strong>{wbsStats.total}</strong><span>Tổng Task</span></article><article><strong>{wbsStats.completed}</strong><span>Hoàn thành</span></article><article><strong>{wbsStats.inProgress}</strong><span>Đang thực hiện</span></article><article><strong>{wbsStats.overdue}</strong><span>Quá hạn</span></article><article><strong>{wbsStats.progress}%</strong><span>Tiến độ TB</span></article></div><div className="project-wbs-controls"><div className="project-view-toggle"><button type="button" className={progressView === 'list' ? 'active' : ''} onClick={() => setProgressView('list')}>Danh sách</button><button type="button" className={progressView === 'gantt' ? 'active' : ''} onClick={() => setProgressView('gantt')}>Gantt</button></div><input value={wbsSearch} onChange={event => setWbsSearch(event.target.value)} placeholder="Tìm theo mã, tiêu đề, người thực hiện..." aria-label="Tìm work item" /><select value={wbsIteration} onChange={event => setWbsIteration(event.target.value)} aria-label="Lọc iteration"><option value="all">Tất cả iteration</option>{wbsIterations.map(iteration => <option key={iteration} value={iteration}>{iteration}</option>)}</select><select value={wbsState} onChange={event => setWbsState(event.target.value)} aria-label="Lọc trạng thái"><option value="all">Tất cả trạng thái</option>{wbsStates.map(state => <option key={state} value={state}>{state}</option>)}</select>{(wbsSearch || wbsState !== 'all' || wbsIteration !== 'all') && <button type="button" className="project-filter-reset" onClick={() => { setWbsSearch(''); setWbsState('all'); setWbsIteration('all'); }}>Xóa lọc</button>}</div><div className="project-table-wrap"><table className="project-table project-wbs-table"><thead><tr><th>WBS / Work item</th><th>Iteration</th><th>Loại</th><th>Trạng thái</th><th>Người thực hiện</th></tr></thead><tbody>{filteredWbsItems.length === 0 ? <tr><td colSpan={5} className="project-table-empty">Không có work item phù hợp bộ lọc.</td></tr> : [...filteredWbsItems].sort((left, right) => (left.iterationPath || '').localeCompare(right.iterationPath || '') || left.id - right.id).map(item => <tr key={item.id}><td><button type="button" className="project-work-item-link project-wbs-item-link" onClick={() => void openWorkItem(item.id)}><strong style={{ paddingLeft: item.parentId ? '1.1rem' : undefined }}>{item.parentId ? '↳ ' : ''}#{item.id} {item.title || '(Không có tiêu đề)'}</strong></button>{item.parentId && <small>Task cha: #{item.parentId}</small>}</td><td>{item.iterationPath || '—'}</td><td>{item.workItemType || '—'}</td><td><span className="project-status-chip">{item.state || '—'}</span></td><td>{item.assignedTo || '—'}</td></tr>)}</tbody></table><small className="muted project-table-note">Hiển thị {filteredWbsItems.length} / {workItemTotal} work items đã tải. Chưa có thao tác sửa, kéo thả hoặc Gantt.</small><LoadMoreButton /></div></div>;

    return <EmptyState text="Sheet này chưa có nguồn dữ liệu được phê duyệt." />;
  }

  function renderNoticeModal() {
    if (!notice) return null;
    return <div className="migration-notice-modal" role="dialog" aria-modal="true" aria-labelledby="migration-notice-title">
      <button type="button" className="migration-notice-backdrop" aria-label="Đóng thông báo" onClick={() => setNotice(null)} />
      <article className="migration-notice-panel"><header><div><p className="eyebrow">FiinGroupApp</p><h3 id="migration-notice-title">{notice.title}</h3></div><button type="button" className="work-item-modal-close" onClick={() => setNotice(null)} aria-label="Đóng">×</button></header><p>{notice.message}</p><footer><button type="button" className="btn btn-tools" onClick={() => setNotice(null)}>Đóng</button></footer></article>
    </div>;
  }

  function renderDeleteModal() {
    if (!deleteTask) return null;
    return <div className="migration-notice-modal" role="dialog" aria-modal="true" aria-labelledby="delete-task-title">
      <button type="button" className="migration-notice-backdrop" aria-label="Đóng xác nhận xóa" onClick={() => setDeleteTask(null)} />
      <article className="migration-notice-panel">
        <header><div><p className="eyebrow">TFS Work Item #{deleteTask.id}</p><h3 id="delete-task-title">Xóa Task</h3></div><button type="button" className="work-item-modal-close" onClick={() => setDeleteTask(null)} aria-label="Đóng">×</button></header>
        <p>Bạn muốn xóa task “{deleteTask.taskCode || 'TFS-' + deleteTask.id}: {deleteTask.title || '(Không có tiêu đề)'}”?</p>
        <p className="muted">Thao tác xóa chưa được bật vì source Jarvis còn xóa dữ liệu liên kết trong Jarvis DB. Không có dữ liệu nào được thay đổi.</p>
        <footer><button type="button" className="btn btn-tools" onClick={() => setDeleteTask(null)}>Không</button><button type="button" className="btn btn-danger" disabled title="Chờ contract xóa đồng bộ TFS và Jarvis DB">Có</button></footer>
      </article>
    </div>;
  }

  function renderWorkItemModal() {
    if (!workItemDetail) return null;
    return <div className="work-item-modal" role="dialog" aria-modal="true" aria-labelledby="active-work-item-detail-title">
      <button type="button" className="work-item-modal-backdrop" aria-label="Đóng chi tiết work item" onClick={() => setWorkItemDetail(null)} />
      <article className="work-item-modal-panel"><header><div><p className="eyebrow">TFS Work Item #{workItemDetail.id}</p><h3 id="active-work-item-detail-title">{workItemDetail.title || '(Không có tiêu đề)'}</h3></div><button type="button" className="work-item-modal-close" onClick={() => setWorkItemDetail(null)} aria-label="Đóng">×</button></header><div className="work-item-detail-grid"><div><span>Loại</span><strong>{workItemDetail.workItemType || '—'}</strong></div><div><span>Trạng thái</span><strong>{workItemDetail.state || '—'}</strong></div><div><span>Người thực hiện</span><strong>{workItemDetail.assignedTo || '—'}</strong></div><div><span>Iteration</span><strong>{workItemDetail.iterationPath || '—'}</strong></div><div><span>Ngày tạo</span><strong>{formatTaskDate(workItemDetail.createdDate)}</strong></div><div><span>Cập nhật</span><strong>{formatTaskDate(workItemDetail.changedDate)}</strong></div><div><span>Task cha</span><strong>{workItemDetail.parentId ? '#' + workItemDetail.parentId : '—'}</strong></div><div><span>Priority</span><strong>{workItemDetail.priority || '—'}</strong></div></div>{workItemDetail.description && <div className="work-item-detail-block"><span>Description</span><p>{workItemDetail.description}</p></div>}{workItemDetail.tags && <div className="work-item-detail-block"><span>Tags</span><p>{workItemDetail.tags}</p></div>}{workItemDetail.history && <div className="work-item-detail-block"><span>History</span><p>{workItemDetail.history}</p></div>}<footer><span className="muted">Dữ liệu đọc từ TFS. Thao tác sửa được kiểm soát riêng theo quyền và cấu hình.</span>{workItemDetail.url && <a href={workItemDetail.url} target="_blank" rel="noreferrer">Mở trên TFS</a>}</footer></article>
    </div>;
  }

  if (!targetMode) return <section className="platform-card"><h2>{progressMode ? 'Tiến độ dự án' : 'Quản lý dự án'}</h2><p>Chuyển frontend sang <code>VITE_AUTH_MODE=target-dev</code> để sử dụng phiên TFS của hệ thống mới.</p></section>;

  if (pageKind === 'management') {
    return <section className="projectmanagement sheetmode">
      <div className="projectmanagement-head">
        <div className="projectmanagement-head-left"><h1 className="projectmanagement-h1">Quản lý dự án</h1></div>
        <div className="projectmanagement-proj"><label htmlFor="projectmanagementProject">Dự án</label><select id="projectmanagementProject" className="projectmanagement-select" value={selected ? selected.collection + '/' + selected.id : ''} onChange={event => { const project = projects.find(item => item.collection + '/' + item.id === event.target.value); if (project) void selectProject(project); else clearProjectSelection(); }}><option value="">— Chọn dự án —</option>{projects.map(project => <option key={project.collection + '/' + project.id} value={project.collection + '/' + project.id}>{project.name} ({project.collection})</option>)}</select></div>
      </div>
      <div className="pm-sheets source-pm-sheets" role="tablist" aria-label="Project management sheets">{jarvisManagementSheets.map(sheet => <button key={sheet.key} type="button" role="tab" aria-selected={activeSheet === sheet.key} aria-disabled={!sheet.available} className={'pm-sheet-tab' + (activeSheet === sheet.key ? ' active' : '') + (!sheet.available ? ' unavailable' : '')} title={sheet.available ? sheet.label : `${sheet.label}: ${sheet.reason}`} onClick={() => changeSheet(sheet.key)}>{sheet.label}{sheet.key !== 'overview' && <span className={'st-dot ' + (sheet.available ? 's-done' : 's-na')} />}</button>)}</div>
      {error && <p className="error">{error}</p>}
      {loading && <div className="projectmanagement-state">Đang tải danh sách dự án…</div>}
      {!loading && !selected && <div className="projectmanagement-state">Chọn dự án để xem dòng chảy.</div>}
      {!loading && selected && <>
        {activeSheet === 'overview' && <>
          <div className="projectmanagement-summary"><div className="sb-proj"><div className="t" title={selected.name}>{selected.name}</div><div className="m">Collection: {selected.collection} · Trạng thái: {selected.state || '—'}</div></div><div className="sb-kpi"><div className="k">Teams</div><div className="v">{loadedSheets.has('teams') ? teams.length : '—'}</div></div><div className="sb-kpi exec"><div className="k">Work items</div><div className="v">{loadedSheets.has('work-items') ? workItemTotal : '—'}</div></div></div>
          <div className="projectmanagement-state">Chưa có dữ liệu `pm-flow` từ Jarvis DB trong hệ thống mới. Phần dữ liệu TFS hiện tại chỉ hiển thị theo chế độ đọc.</div>
        </>}
        {activeSheet === 'wbs' && <div className="projectmanagement-wbs-host">{renderSheetContent()}</div>}
      </>}
       {selected?.url && <a className="project-api-link" href={selected.url} target="_blank" rel="noreferrer">Mở project API URL</a>}
       {renderNoticeModal()}
       {renderWorkItemModal()}
     </section>;
  }

  if (pageKind === 'tasks') {
    return <section className="project-tasks-page">
      <div className="page-header-wrapper">
        <div className="page-title-row"><h1 className="page-title"><span className="title-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></span><span>Tiến độ dự án</span></h1></div>
        <div className="ig-tabs source-task-tabs" role="tablist"><button type="button" className="ig-tab" disabled title="Chờ nguồn dữ liệu Jarvis DB.">Tổng hợp</button><button type="button" className="ig-tab active" role="tab" aria-selected="true">Tiến độ dự án</button></div>
      </div>
       <div className="page-toolbar source-task-toolbar"><div className="toolbar-filters"><select className="form-control filter-select" value={selected ? selected.collection + '/' + selected.id : ''} onChange={event => { const project = projects.find(item => item.collection + '/' + item.id === event.target.value); if (project) void selectProject(project); else clearProjectSelection(); }}><option value="">-- Chọn dự án --</option>{projects.map(project => <option key={project.collection + '/' + project.id} value={project.collection + '/' + project.id}>{project.name}</option>)}</select><select className="form-control filter-select" value={wbsState} onChange={event => setWbsState(event.target.value)}><option value="all">-- Trạng thái --</option>{wbsStates.map(state => <option key={state} value={state}>{state}</option>)}</select><select className="form-control filter-select" value={wbsAssignee} onChange={event => setWbsAssignee(event.target.value)}><option value="all">-- Người thực hiện --</option>{wbsAssignees.map(assignee => <option key={assignee} value={assignee}>{assignee}</option>)}</select><select className="form-control filter-select" value={wbsPriority} onChange={event => setWbsPriority(event.target.value)}><option value="all">-- Độ ưu tiên --</option><option value="1">Thấp</option><option value="2">Trung bình</option><option value="3">Cao</option><option value="4">Khẩn cấp</option></select></div><div className="toolbar-actions"><div className="btn-group view-toggle source-view-toggle" role="group"><input type="radio" className="btn-check" name="projectTaskViewMode" id="projectTaskViewGrid" value="list" checked={progressView === 'list'} onChange={() => setProgressView('list')} /><label className={'btn btn-outline-secondary btn-sm' + (progressView === 'list' ? ' active' : '')} htmlFor="projectTaskViewGrid" title="Danh sách"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg></label><input type="radio" className="btn-check" name="projectTaskViewMode" id="projectTaskViewGantt" value="gantt" checked={progressView === 'gantt'} onChange={() => setProgressView('gantt')} /><label className={'btn btn-outline-secondary btn-sm' + (progressView === 'gantt' ? ' active' : '')} htmlFor="projectTaskViewGantt" title="Gantt Chart"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="4" rx="1" /><rect x="5" y="10" width="12" height="4" rx="1" /><rect x="7" y="16" width="8" height="4" rx="1" /></svg></label><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => showBoundaryNotice('Phân bổ nguồn lực', 'Chức năng này cần nguồn dữ liệu Resource của Jarvis DB và chưa được chuyển sang API mới.')} title="Chờ API Resource của Jarvis DB."><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></button></div><div className={'pm-tools' + (toolsOpen ? ' open' : '')}><button type="button" className="btn btn-tools" onClick={() => setToolsOpen(value => !value)} title="Công cụ khác"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></svg><span>Công cụ</span><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="arrow"><polyline points="6 9 12 15 18 9" /></svg></button>{toolsOpen && <div className="pm-tools-menu"><button type="button" className="btn-tool-item" onClick={() => showBoundaryNotice('Đồng bộ dự án', 'Chưa có API ghi đồng bộ TFS vào hệ thống mới. Không có dữ liệu nào được thay đổi.')}><ToolMenuIcon kind="sync" /><span>Đồng bộ dự án đang chọn</span></button><button type="button" className="btn-tool-item" onClick={() => showBoundaryNotice('Đường găng', 'Logic đường găng của Jarvis chưa có nguồn dữ liệu tương đương trong hệ thống mới.')}><ToolMenuIcon kind="critical" /><span>Đường găng</span></button><button type="button" className="btn-tool-item" onClick={() => showBoundaryNotice('Baseline', 'Chức năng Baseline chưa được chuyển đổi vì chưa có API lưu trữ tương đương.')}><ToolMenuIcon kind="baseline" /><span>Baseline</span></button><button type="button" className="btn-tool-item" onClick={() => showBoundaryNotice('Lịch sử', 'Chức năng lịch sử hoạt động cần dữ liệu Jarvis DB và chưa khả dụng trong bản read-only này.')}><ToolMenuIcon kind="history" /><span>Lịch sử</span></button><button type="button" className="btn-tool-item" onClick={() => showBoundaryNotice('Xuất/Nhập', 'Chức năng xuất/nhập task chưa được bật để tránh ghi sai dữ liệu TFS.')}><ToolMenuIcon kind="export" /><span>Xuất/Nhập</span></button><button type="button" className="btn-tool-item" onClick={() => { setToolsOpen(false); if (selected) void loadProjectData('work-items'); }} disabled={!selected || dataLoading !== null}><ToolMenuIcon kind="refresh" /><span>Làm mới</span></button></div>}</div><button type="button" className="source-add-task" onClick={() => selected ? setCreateTaskOpen(true) : showBoundaryNotice('Chọn dự án trước', 'Vui lòng chọn dự án trước khi thêm task.')} title={selected ? 'Thêm task mới' : 'Vui lòng chọn dự án trước'}><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg><span>Thêm Task</span></button></div></div>
      {error && <p className="error">{error}</p>}
      {loading && <div className="projectmanagement-state">Đang tải danh sách dự án…</div>}
      {!loading && selected && workItems.length > 0 && <div className="summary-stats source-summary-stats" id="taskStats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="stat-content"><div className="stat-value">{wbsStats.total}</div><div className="stat-label">Tổng Task</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-content"><div className="stat-value">{wbsStats.completed}</div><div className="stat-label">Hoàn thành</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="stat-content"><div className="stat-value">{wbsStats.inProgress}</div><div className="stat-label">Đang thực hiện</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-danger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="stat-content"><div className="stat-value">{wbsStats.overdue}</div><div className="stat-label">Quá hạn</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20" />
            </svg>
          </div>
          <div className="stat-content"><div className="stat-value">{wbsStats.progress}%</div><div className="stat-label">Tiến độ TB</div></div>
        </div>
      </div>}
       {!loading && <div className="project-tasks-content source-task-surface">{selected && workItems.length > 0 && progressView === 'gantt' ? renderSourceGantt() : renderSourceTaskGrid()}</div>}
       {renderNoticeModal()}
       {renderDeleteModal()}
       {selected && createTaskOpen && <TfsTaskCreateModal project={selected} workItems={workItems} onClose={() => setCreateTaskOpen(false)} onCreated={item => { setCreateTaskOpen(false); setNotice({ title: 'Đã tạo Task', message: `Work Item #${item.id} đã được tạo trên TFS.` }); void loadProjectData('work-items'); }} />}
       {selected && editTask && <TfsTaskCreateModal project={selected} workItems={workItems} item={editTask} onClose={() => setEditTask(null)} onCreated={item => { setEditTask(null); setNotice({ title: 'Đã cập nhật Task', message: `Work Item #${item.id} đã được cập nhật trên TFS.` }); void loadProjectData('work-items'); }} />}
       {renderWorkItemModal()}
     </section>;
  }

  return <section className="projects-page">
    <div className="page-heading">
      <div><p className="eyebrow">{progressMode ? 'WBS / Gantt migration slice' : 'Quản lý dự án'}</p><h2>{progressMode ? 'Tiến độ dự án' : 'Quản lý dự án'}</h2><p className="muted">{progressMode ? 'Theo dõi read-only work items theo iteration từ TFS.' : 'Giao diện đọc-only, tổ chức theo sheet tương tự FiinGroup.Jarvis.'}</p></div>
      <button type="button" onClick={() => void loadProjects()} disabled={loading}>{loading ? 'Đang tải...' : 'Tải lại'}</button>
    </div>
    {progressMode && <div className="project-mode-banner"><strong>Tiến độ dự án — TFS</strong><span>Chọn project bên trái để tải WBS. Gantt và sửa Task dùng dữ liệu TFS; baseline, đường găng, import/export và cập nhật tiến độ PMBOK vẫn chờ nguồn Jarvis DB.</span></div>}
    {error && <p className="error">{error}</p>}
    {loading && <LoadingState text="Đang tải danh sách dự án từ TFS..." />}
    {!loading && !projects.length && !error && <EmptyState text="Không có dự án TFS nào có thể đọc." />}
    <div className="projects-layout">
      <div className="project-collections">
        {collections.map(([collection, items]) => <section className="project-collection" key={collection}>
          <div className="project-collection-heading"><div><span className="card-label">Collection</span><h3>{collection}</h3></div><span className="project-count">{items.length} dự án</span></div>
          {items.map(project => <button className={'project-item' + (selected?.id === project.id && selected.collection === project.collection ? ' selected' : '')} type="button" key={project.collection + '/' + project.id} onClick={() => void selectProject(project)}>
            <strong>{project.name}</strong><small>{project.state ?? 'unknown'} · {project.id}</small>
          </button>)}
        </section>)}
      </div>
      <aside className="project-detail platform-card">
        {!selected && <><div className="project-progress-empty"><span className="project-progress-icon">◌</span><h3>{progressMode ? 'Chọn dự án để xem tiến độ' : 'Chọn một dự án để bắt đầu'}</h3><p>{progressMode ? 'Danh sách project bên trái được lấy từ các collection TFS mà tài khoản hiện tại có quyền đọc.' : 'Chọn một project để xem thông tin và các sheet quản lý dự án.'}</p></div></>}
        {selected && <>
          <div className="projectmanagement-head"><div><p className="eyebrow">{progressMode ? 'Theo dõi tiến độ' : 'Dự án đang chọn'}</p><h3>{selected.name}</h3><p className="muted">{selected.description || 'Chưa có mô tả từ TFS.'}</p></div><span className="project-status-chip">{selected.state ?? 'unknown'}</span></div>
          <div className="project-summary"><div><span>Collection</span><strong>{selected.collection}</strong></div><div><span>Project ID</span><strong className="break-all">{selected.id}</strong></div></div>
          <div className="pm-sheets" role="tablist" aria-label="Project management sheets">{sheets.filter(sheet => !progressMode || sheet.key === 'wbs').map(sheet => <button key={sheet.key} type="button" role="tab" aria-selected={activeSheet === sheet.key} className={'pm-sheet-tab' + (activeSheet === sheet.key ? ' active' : '')} disabled={!sheet.available} title={sheet.reason} onClick={() => changeSheet(sheet.key)}>{sheet.label}{sheet.key !== 'overview' && sheet.available && loadedSheets.has(sheet.key) && <span className="st-dot s-done" />}</button>)}</div>
          <div className="project-sheet-content">{renderSheetContent()}</div>
          {selected.url && <a className="project-api-link" href={selected.url} target="_blank" rel="noreferrer">Mở project API URL</a>}
        </>}
      </aside>
    </div>
    {notice && <div className="migration-notice-modal" role="dialog" aria-modal="true" aria-labelledby="migration-notice-title">
      <button type="button" className="migration-notice-backdrop" aria-label="Đóng thông báo" onClick={() => setNotice(null)} />
      <article className="migration-notice-panel"><header><div><p className="eyebrow">FiinGroupApp</p><h3 id="migration-notice-title">{notice.title}</h3></div><button type="button" className="work-item-modal-close" onClick={() => setNotice(null)} aria-label="Đóng">×</button></header><p>{notice.message}</p><footer><button type="button" className="btn btn-tools" onClick={() => setNotice(null)}>Đóng</button></footer></article>
    </div>}
    {workItemDetail && <div className="work-item-modal" role="dialog" aria-modal="true" aria-labelledby="work-item-detail-title">
      <button type="button" className="work-item-modal-backdrop" aria-label="Đóng chi tiết work item" onClick={() => setWorkItemDetail(null)} />
      <article className="work-item-modal-panel"><header><div><p className="eyebrow">TFS Work Item #{workItemDetail.id}</p><h3 id="work-item-detail-title">{workItemDetail.title || '(Không có tiêu đề)'}</h3></div><button type="button" className="work-item-modal-close" onClick={() => setWorkItemDetail(null)} aria-label="Đóng">×</button></header><div className="work-item-detail-grid"><div><span>Loại</span><strong>{workItemDetail.workItemType || '—'}</strong></div><div><span>Trạng thái</span><strong>{workItemDetail.state || '—'}</strong></div><div><span>Người thực hiện</span><strong>{workItemDetail.assignedTo || '—'}</strong></div><div><span>Iteration</span><strong>{workItemDetail.iterationPath || '—'}</strong></div><div><span>Ngày tạo</span><strong>{workItemDetail.createdDate || '—'}</strong></div><div><span>Cập nhật</span><strong>{workItemDetail.changedDate || '—'}</strong></div><div><span>Task cha</span><strong>{workItemDetail.parentId ? '#' + workItemDetail.parentId : '—'}</strong></div><div><span>Priority</span><strong>{workItemDetail.priority || '—'}</strong></div></div>{workItemDetail.description && <div className="work-item-detail-block"><span>Description</span><p>{workItemDetail.description}</p></div>}{workItemDetail.tags && <div className="work-item-detail-block"><span>Tags</span><p>{workItemDetail.tags}</p></div>}{workItemDetail.history && <div className="work-item-detail-block"><span>History</span><p>{workItemDetail.history}</p></div>}<footer><span className="muted">Read-only từ TFS. Chưa có thao tác cập nhật.</span>{workItemDetail.url && <a href={workItemDetail.url} target="_blank" rel="noreferrer">Mở trên TFS</a>}</footer></article>
    </div>}
  </section>;
}
