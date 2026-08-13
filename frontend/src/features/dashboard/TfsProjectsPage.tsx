import { useEffect, useMemo, useState } from 'react';
import {
  getTfsIterations,
  getTfsProject,
  getTfsProjects,
  getTfsTeams,
  getTfsWorkItem,
  getTfsWorkItems,
  type TfsIteration,
  type TfsProject,
  type TfsTeam,
  type TfsWorkItemDetail,
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
  const [wbsSearch, setWbsSearch] = useState('');
  const [wbsState, setWbsState] = useState('all');
  const [wbsIteration, setWbsIteration] = useState('all');
  const [wbsPriority, setWbsPriority] = useState('all');
  const [wbsAssignee, setWbsAssignee] = useState('all');
  const [progressView, setProgressView] = useState<string>('list');
  const [ganttCellWidth, setGanttCellWidth] = useState(30);

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
    try {
      const projectDetail = await getTfsProject(project);
      setSelected(projectDetail);
      if (progressMode || pageKind === 'management') {
        setDataLoading('work-items');
        if (pageKind === 'management') {
          const [teamResult, workItemResult] = await Promise.all([
            getTfsTeams(projectDetail),
            getTfsWorkItems(projectDetail, 100, 0),
          ]);
          setTeams(teamResult);
          setWorkItems(workItemResult.items);
          setWorkItemTotal(workItemResult.totalAvailable);
          setWorkItemOffset(workItemResult.items.length);
          setLoadedSheets(previous => new Set(previous).add('teams').add('work-items'));
        } else {
          const result = await getTfsWorkItems(projectDetail, 100, 0);
          setWorkItems(result.items);
          setWorkItemTotal(result.totalAvailable);
          setWorkItemOffset(result.items.length);
          setLoadedSheets(previous => new Set(previous).add('work-items'));
        }
        setDataLoading(null);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải thông tin chi tiết dự án.');
      setDataLoading(null);
    } finally {
      setDetailLoading(false);
    }
  }

  type TfsDataSheet = 'teams' | 'iterations' | 'work-items';

  async function loadProjectData(kind: TfsDataSheet) {
    if (!selected || dataLoading !== null) return;
    setDataLoading(kind);
    setError(null);
    try {
      if (kind === 'teams') setTeams(await getTfsTeams(selected));
      if (kind === 'iterations') setIterations(await getTfsIterations(selected));
      if (kind === 'work-items') {
        const result = await getTfsWorkItems(selected, 100, 0);
        setWorkItems(result.items);
        setWorkItemTotal(result.totalAvailable);
        setWorkItemOffset(result.items.length);
      }
      setLoadedSheets(previous => new Set(previous).add(kind));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu dự án TFS.');
    } finally {
      setDataLoading(null);
    }
  }

  async function loadMoreWorkItems() {
    if (!selected || dataLoading !== null || workItemOffset >= workItemTotal) return;
    setDataLoading('work-items');
    setError(null);
    try {
      const result = await getTfsWorkItems(selected, 100, workItemOffset);
      setWorkItems(previous => [...previous, ...result.items]);
      setWorkItemTotal(result.totalAvailable);
      setWorkItemOffset(previous => previous + result.items.length);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải thêm work items từ TFS.');
    } finally {
      setDataLoading(null);
    }
  }

  async function openWorkItem(workItemId: number) {
    if (!selected || workItemDetailLoading) return;
    setWorkItemDetailLoading(true);
    setError(null);
    try {
      setWorkItemDetail(await getTfsWorkItem(selected, workItemId));
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
    if (workItems.length === 0) return <EmptyState text="Vui lòng chọn dự án để xem danh sách task" />;
    const statusLabels = ['Chưa bắt đầu', 'Đang thực hiện', 'Tạm dừng', 'Hoàn thành'];
    const priorityLabels = ['', 'Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'];
    return <div className="table-wrapper source-task-grid"><div className="table-scroll-x"><table className="data-table project-tasks-table"><thead><tr><th className="col-sticky-left">STT</th><th>Mã</th><th>Tên công việc</th><th>Sản phẩm</th><th>Người thực hiện</th><th>Bắt đầu</th><th>Kết thúc</th><th>Tiến độ</th><th>Plan</th><th>Trạng thái</th><th>Ưu tiên</th><th>Người tạo</th><th className="col-sticky-right">Thao tác</th></tr></thead><tbody>{filteredWbsItems.map((item, index) => { const endDate = item.finishDate || item.targetDate || item.closedDate; const status = item.statusCode >= 0 && item.statusCode < statusLabels.length ? statusLabels[item.statusCode] : (item.state || '—'); return <tr key={item.id}><td className="col-sticky-left text-center">{index + 1}</td><td>{item.taskCode || 'TFS-' + item.id}</td><td><div className="task-name-cell" style={{ paddingLeft: item.parentId ? '1.25rem' : undefined }}><span>{item.parentId ? '↳ ' : ''}{item.title || '(Không có tiêu đề)'}</span></div></td><td>{item.product || '—'}</td><td>{item.assignedTo || '—'}</td><td className="text-center">{formatTaskDate(item.startDate)}</td><td className="text-center">{formatTaskDate(endDate)}</td><td><div className="progress-cell"><div className="progress-bar-wrapper"><div className="progress-bar-fill" style={{ width: item.progress + '%' }} /></div><span className="progress-text">{Math.round(item.progress)}%</span></div></td><td><div className="progress-cell"><div className="progress-bar-wrapper"><div className="progress-bar-fill" style={{ width: item.plan + '%', background: '#17a2b8' }} /></div><span className="progress-text">{Math.round(item.plan)}%</span></div></td><td><span className={'status-badge status-' + item.statusCode}>{status}</span></td><td><span className={'priority-badge priority-badge-' + item.priorityCode}>{priorityLabels[item.priorityCode] || 'Trung bình'}</span></td><td>{item.createdBy || '—'}</td><td className="col-sticky-right"><button type="button" className="project-work-item-link" onClick={() => void openWorkItem(item.id)}>Xem</button></td></tr>; })}</tbody></table><small className="muted project-table-note">Hiển thị {filteredWbsItems.length} / {workItemTotal} work items từ TFS. Chưa có thao tác tạo/sửa/xóa.</small><LoadMoreButton /></div></div>;
  }

  function changeSheet(sheet: ProjectSheet) {
    if (!selected || !sheets.find(item => item.key === sheet)?.available) return;
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

  if (!targetMode) return <section className="platform-card"><h2>{progressMode ? 'Tiến độ dự án' : 'TFS Projects'}</h2><p>Chuyển frontend sang <code>VITE_AUTH_MODE=target-dev</code> để sử dụng phiên TFS của hệ thống mới.</p></section>;

  if (pageKind === 'management') {
    return <section className="projectmanagement sheetmode">
      <div className="projectmanagement-head">
        <div className="projectmanagement-head-left"><h1 className="projectmanagement-h1">Quản lý dự án</h1></div>
        <div className="projectmanagement-proj"><label htmlFor="projectmanagementProject">Dự án</label><select id="projectmanagementProject" className="projectmanagement-select" value={selected ? selected.collection + '/' + selected.id : ''} onChange={event => { const project = projects.find(item => item.collection + '/' + item.id === event.target.value); if (project) void selectProject(project); }}><option value="">— Chọn dự án —</option>{projects.map(project => <option key={project.collection + '/' + project.id} value={project.collection + '/' + project.id}>{project.name} ({project.collection})</option>)}</select></div>
      </div>
      <div className="pm-sheets source-pm-sheets" role="tablist" aria-label="Project management sheets">{jarvisManagementSheets.map(sheet => <button key={sheet.key} type="button" role="tab" aria-selected={activeSheet === sheet.key} className={'pm-sheet-tab' + (activeSheet === sheet.key ? ' active' : '')} disabled={!sheet.available} title={sheet.reason} onClick={() => changeSheet(sheet.key)}>{sheet.label}{sheet.key !== 'overview' && <span className={'st-dot ' + (sheet.available ? 's-done' : 's-na')} />}</button>)}</div>
      {error && <p className="error">{error}</p>}
      {loading && <div className="projectmanagement-state">Đang tải danh sách dự án…</div>}
      {!loading && !selected && <div className="projectmanagement-state">Chọn dự án để xem dòng chảy.</div>}
      {!loading && selected && <>
        {activeSheet === 'overview' && <>
          <div className="projectmanagement-summary"><div className="sb-proj"><div className="t" title={selected.name}>{selected.name}</div><div className="m">Collection: {selected.collection} · Trạng thái: {selected.state || '—'}</div></div><div className="sb-kpi"><div className="k">Teams</div><div className="v">{loadedSheets.has('teams') ? teams.length : '—'}</div></div><div className="sb-kpi exec"><div className="k">Work items</div><div className="v">{loadedSheets.has('work-items') ? workItemTotal : '—'}</div></div></div>
          <div className="projectmanagement-state">Chưa có dữ liệu `pm-flow` từ Jarvis DB trong hệ thống mới. Thông tin TFS của dự án đã được xác thực ở màn TFS Projects.</div>
        </>}
        {activeSheet === 'wbs' && <div className="projectmanagement-wbs-host">{renderSheetContent()}</div>}
      </>}
      {selected?.url && <a className="project-api-link" href={selected.url} target="_blank" rel="noreferrer">Mở project API URL</a>}
    </section>;
  }

  if (pageKind === 'tasks') {
    return <section className="project-tasks-page">
      <div className="page-header-wrapper">
        <div className="page-title-row"><h1 className="page-title"><span className="title-icon">✓</span><span>Tiến độ dự án</span></h1></div>
        <div className="ig-tabs source-task-tabs" role="tablist"><button type="button" className="ig-tab" disabled title="Chờ nguồn dữ liệu Jarvis DB.">Tổng hợp</button><button type="button" className="ig-tab active" role="tab" aria-selected="true">Tiến độ dự án</button></div>
      </div>
      <div className="page-toolbar source-task-toolbar"><div className="toolbar-filters"><select className="form-control filter-select" value={selected ? selected.collection + '/' + selected.id : ''} onChange={event => { const project = projects.find(item => item.collection + '/' + item.id === event.target.value); if (project) void selectProject(project); }}><option value="">-- Chọn dự án --</option>{projects.map(project => <option key={project.collection + '/' + project.id} value={project.collection + '/' + project.id}>{project.name}</option>)}</select><select className="form-control filter-select" value={wbsState} onChange={event => setWbsState(event.target.value)}><option value="all">-- Trạng thái --</option>{wbsStates.map(state => <option key={state} value={state}>{state}</option>)}</select><select className="form-control filter-select" value={wbsAssignee} onChange={event => setWbsAssignee(event.target.value)}><option value="all">-- Người thực hiện --</option>{wbsAssignees.map(assignee => <option key={assignee} value={assignee}>{assignee}</option>)}</select><select className="form-control filter-select" value={wbsPriority} onChange={event => setWbsPriority(event.target.value)}><option value="all">-- Độ ưu tiên --</option><option value="1">Thấp</option><option value="2">Trung bình</option><option value="3">Cao</option><option value="4">Khẩn cấp</option></select></div><div className="toolbar-actions"><div className="btn-group view-toggle source-view-toggle"><button type="button" className={'btn btn-outline-secondary btn-sm' + (progressView === 'list' ? ' active' : '')} onClick={() => setProgressView('list')} title="Danh sách">☷</button><button type="button" className={'btn btn-outline-secondary btn-sm' + (progressView === 'gantt' ? ' active' : '')} onClick={() => setProgressView('gantt')} title="Gantt Chart">▤</button><button type="button" className="btn btn-outline-secondary btn-sm" disabled title="Chờ API Resource của Jarvis DB.">♙</button></div><button type="button" className="btn btn-tools" disabled title="Chờ API công cụ của Jarvis DB.">Công cụ</button><button type="button" className="btn btn-tools" disabled title="Chờ API đường găng của Jarvis DB.">Đường găng</button><button type="button" className="btn btn-tools" disabled title="Chờ API Baseline của Jarvis DB.">Baseline</button><button type="button" className="btn btn-tools" disabled title="Chờ API lịch sử của Jarvis DB.">Lịch sử</button><button type="button" className="btn btn-tools" disabled title="Chờ API xuất nhập của Jarvis DB.">Xuất/Nhập</button><button type="button" className="btn btn-tools" onClick={() => void loadProjectData('work-items')} disabled={!selected || dataLoading !== null}>Làm mới</button></div></div>
      {error && <p className="error">{error}</p>}
      {loading && <div className="projectmanagement-state">Đang tải danh sách dự án…</div>}
      {!loading && !selected && <div className="projectmanagement-state">Vui lòng chọn dự án để xem danh sách task</div>}
      {!loading && selected && workItems.length > 0 && <div className="summary-stats source-summary-stats"><div className="stat-card"><div className="stat-icon stat-icon-total">#</div><div className="stat-content"><div className="stat-value">{wbsStats.total}</div><div className="stat-label">Tổng Task</div></div></div><div className="stat-card"><div className="stat-icon stat-icon-success">✓</div><div className="stat-content"><div className="stat-value">{wbsStats.completed}</div><div className="stat-label">Hoàn thành</div></div></div><div className="stat-card"><div className="stat-icon stat-icon-warning">◷</div><div className="stat-content"><div className="stat-value">{wbsStats.inProgress}</div><div className="stat-label">Đang thực hiện</div></div></div><div className="stat-card"><div className="stat-icon stat-icon-danger">!</div><div className="stat-content"><div className="stat-value">{wbsStats.overdue}</div><div className="stat-label">Quá hạn</div></div></div><div className="stat-card"><div className="stat-icon stat-icon-info">↗</div><div className="stat-content"><div className="stat-value">{wbsStats.progress}%</div><div className="stat-label">Tiến độ TB</div></div></div></div>}
      {!loading && selected && <div className="project-tasks-content">{progressView === 'list' ? renderSourceTaskGrid() : renderSheetContent()}</div>}
    </section>;
  }

  return <section className="projects-page">
    <div className="page-heading">
      <div><p className="eyebrow">{progressMode ? 'WBS / Gantt migration slice' : 'Quản lý dự án'}</p><h2>{progressMode ? 'Tiến độ dự án' : 'TFS Projects'}</h2><p className="muted">{progressMode ? 'Theo dõi read-only work items theo iteration từ TFS.' : 'Giao diện đọc-only, tổ chức theo sheet tương tự FiinGroup.Jarvis.'}</p></div>
      <button type="button" onClick={() => void loadProjects()} disabled={loading}>{loading ? 'Đang tải...' : 'Tải lại'}</button>
    </div>
    {progressMode && <div className="project-mode-banner"><strong>Tiến độ dự án — TFS read-only</strong><span>Chọn project bên trái để tải WBS. Các thao tác sửa task, Gantt, baseline và import/export chưa được bật trong giai đoạn này.</span></div>}
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
    {workItemDetail && <div className="work-item-modal" role="dialog" aria-modal="true" aria-labelledby="work-item-detail-title">
      <button type="button" className="work-item-modal-backdrop" aria-label="Đóng chi tiết work item" onClick={() => setWorkItemDetail(null)} />
      <article className="work-item-modal-panel"><header><div><p className="eyebrow">TFS Work Item #{workItemDetail.id}</p><h3 id="work-item-detail-title">{workItemDetail.title || '(Không có tiêu đề)'}</h3></div><button type="button" className="work-item-modal-close" onClick={() => setWorkItemDetail(null)} aria-label="Đóng">×</button></header><div className="work-item-detail-grid"><div><span>Loại</span><strong>{workItemDetail.workItemType || '—'}</strong></div><div><span>Trạng thái</span><strong>{workItemDetail.state || '—'}</strong></div><div><span>Người thực hiện</span><strong>{workItemDetail.assignedTo || '—'}</strong></div><div><span>Iteration</span><strong>{workItemDetail.iterationPath || '—'}</strong></div><div><span>Ngày tạo</span><strong>{workItemDetail.createdDate || '—'}</strong></div><div><span>Cập nhật</span><strong>{workItemDetail.changedDate || '—'}</strong></div><div><span>Task cha</span><strong>{workItemDetail.parentId ? '#' + workItemDetail.parentId : '—'}</strong></div><div><span>Priority</span><strong>{workItemDetail.priority || '—'}</strong></div></div>{workItemDetail.description && <div className="work-item-detail-block"><span>Description</span><p>{workItemDetail.description}</p></div>}{workItemDetail.tags && <div className="work-item-detail-block"><span>Tags</span><p>{workItemDetail.tags}</p></div>}{workItemDetail.history && <div className="work-item-detail-block"><span>History</span><p>{workItemDetail.history}</p></div>}<footer><span className="muted">Read-only từ TFS. Chưa có thao tác cập nhật.</span>{workItemDetail.url && <a href={workItemDetail.url} target="_blank" rel="noreferrer">Mở trên TFS</a>}</footer></article>
    </div>}
  </section>;
}
