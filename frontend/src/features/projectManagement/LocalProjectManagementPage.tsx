import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getProjectManagementProjects,
  getProjectManagementCriticalPath,
  getProjectManagementBaselines,
  getProjectManagementBaselineComparison,
  getProjectManagementTaskComments,
  getProjectManagementCommentReplies,
  getProjectManagementTaskAttachments,
  getProjectManagementTaskActivity,
  getProjectManagementActivityPage,
  getProjectManagementWorkload,
  getProjectManagementPayments,
  getProjectManagementCostsOther,
  getProjectManagementPdca,
  getProjectManagementRequests,
  getProjectManagementCommissions,
  getProjectManagementPaymentDocuments,
  getProjectManagementGantt,
  downloadProjectManagementExport,
  getProjectManagementPmbokWorkspace,
  getProjectManagementWorkspace,
  projectManagementProjectLabel,
  sortProjectManagementProjects,
  type ProjectManagementProject,
  type ProjectManagementCriticalPath,
  type ProjectManagementBaseline,
  type ProjectManagementBaselineComparison,
  type ProjectManagementTaskComment,
  type ProjectManagementTaskAttachment,
  type ProjectManagementTaskActivity,
  type ProjectManagementActivityPage,
  type ProjectManagementWorkload,
  type ProjectManagementPayment,
  type ProjectManagementCostOther,
  type ProjectManagementPdca,
  type ProjectManagementRequest,
  type ProjectManagementCommission,
  type ProjectManagementPaymentDocument,
  type ProjectManagementGantt,
  type ProjectManagementTaskDetails,
  type ProjectManagementPmbokWorkspace,
  type ProjectManagementWorkspace,
} from './projectManagementClient';
import LocalProjectManagementPmbok, { type PmbokTabKey } from './LocalProjectManagementPmbok';

const SOURCE_PM_SHEETS = [
  { key: 'overview', label: 'Tổng quan', target: 'local-pm-flow' },
  { key: 'charter', label: 'Charter', target: 'local-pm-pmbok' },
  { key: 'stakeholder', label: 'Stakeholder', target: 'local-pm-pmbok' },
  { key: 'wbs', label: 'WBS', target: 'local-pm-wbs' },
  { key: 'resource', label: 'Resource & RACI', target: 'local-pm-pmbok' },
  { key: 'cost', label: 'Cost & Budget', target: 'local-pm-pmbok' },
  { key: 'risk', label: 'Risk', target: 'local-pm-pmbok' },
  { key: 'quality', label: 'Quality', target: 'local-pm-pmbok' },
  { key: 'communication', label: 'Communication', target: 'local-pm-pmbok' },
  { key: 'change_log', label: 'Change Log', target: 'local-pm-pmbok' },
] as const;

type LocalProjectSheet = typeof SOURCE_PM_SHEETS[number]['key'];
type LocalProjectAnalysis = 'workload' | 'critical-path' | 'baseline' | 'activity' | 'export';

function isLocalProjectSheet(value: string | null): value is LocalProjectSheet {
  return value !== null && SOURCE_PM_SHEETS.some(sheet => sheet.key === value);
}

function isLocalProjectAnalysis(value: string | null): value is LocalProjectAnalysis {
  return value === 'workload' || value === 'critical-path' || value === 'baseline' || value === 'activity' || value === 'export';
}

const LOCAL_PROJECT_STORAGE_KEY = 'projectmanagement.targetProject';
const LEGACY_LOCAL_PROJECT_STORAGE_KEY = 'projectmanagement.lastProject';

import LocalProjectManagementFlow, { buildFlow } from './LocalProjectManagementFlow';
import LocalProjectManagementGantt from './LocalProjectManagementGantt';

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value.includes(' ') ? value.replace(' ', 'T') : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function statusLabel(status: number) {
  return ({ 0: 'Chưa bắt đầu', 1: 'Đang thực hiện', 2: 'Tạm dừng', 3: 'Hoàn thành', 9: 'Đã ẩn' } as Record<number, string>)[status] ?? `Mã ${status}`;
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

function varianceLabel(value: number | null) {
  if (value === null) return '-';
  if (value > 0) return `+${value}d`;
  return `${value}d`;
}

function varianceClass(value: number | null) {
  if (value === null || value === 0) return 'neutral';
  return value > 0 ? 'late' : 'early';
}

function activityLabel(actionType: string) {
  return ({
    create: 'Tạo task', update: 'Cập nhật task', delete: 'Xóa task', status_change: 'Đổi trạng thái',
    progress_update: 'Cập nhật tiến độ', assignee_add: 'Thêm người phụ trách', assignee_remove: 'Bỏ người phụ trách',
    dependency_add: 'Thêm phụ thuộc', dependency_remove: 'Bỏ phụ thuộc', comment_add: 'Thêm bình luận',
    attachment_add: 'Đính kèm file', baseline_create: 'Tạo baseline',
  } as Record<string, string>)[actionType] ?? actionType;
}

function formatFileSize(value: number | null) {
  if (value === null) return '-';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function TaskDetail({ item, workspace }: { item: ProjectManagementTaskDetails; workspace: ProjectManagementWorkspace }) {
  const taskNames = useMemo(() => new Map(workspace.tasks.map(entry => [entry.task.id, entry.task.taskName])), [workspace.tasks]);
  const task = item.task;
  const [comments, setComments] = useState<ProjectManagementTaskComment[]>([]);
  const [attachments, setAttachments] = useState<ProjectManagementTaskAttachment[]>([]);
  const [activities, setActivities] = useState<ProjectManagementTaskActivity[]>([]);
  const [replies, setReplies] = useState<Record<number, ProjectManagementTaskComment[]>>({});
  const [openReplies, setOpenReplies] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [repliesLoading, setRepliesLoading] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setDetailLoading(true);
    setDetailError(null);
    setComments([]);
    setAttachments([]);
    setActivities([]);
    setReplies({});
    setOpenReplies(null);
    void Promise.all([
      getProjectManagementTaskComments(task.id),
      getProjectManagementTaskAttachments(task.id),
      getProjectManagementTaskActivity(task.id),
    ]).then(([nextComments, nextAttachments, nextActivities]) => {
      if (!active) return;
      setComments(nextComments);
      setAttachments(nextAttachments);
      setActivities(nextActivities);
    }).catch(exception => {
      if (active) setDetailError(exception instanceof Error ? exception.message : 'Không tải được collaboration data.');
    }).finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [task.id]);

  const toggleReplies = (commentId: number) => {
    if (openReplies === commentId) {
      setOpenReplies(null);
      return;
    }
    setOpenReplies(commentId);
    if (replies[commentId]) return;
    setRepliesLoading(commentId);
    void getProjectManagementCommentReplies(commentId)
      .then(result => setReplies(current => ({ ...current, [commentId]: result })))
      .catch(exception => setDetailError(exception instanceof Error ? exception.message : 'Không tải được replies.'))
      .finally(() => setRepliesLoading(null));
  };

  return <article className="local-pm-task-detail">
    <div className="local-pm-detail-heading"><div><span className="card-label">Task detail</span><h3>{task.taskCode} · {task.taskName}</h3></div><span className="project-status-chip">{statusLabel(task.status)}</span></div>
    <div className="local-pm-detail-grid">
      <div><span>Ngày kế hoạch</span><strong>{formatDate(task.startDate)} → {formatDate(task.endDate)}</strong></div>
      <div><span>Ngày thực tế</span><strong>{formatDate(task.actualStartDate)} → {formatDate(task.actualEndDate)}</strong></div>
      <div><span>Thời lượng</span><strong>{task.duration || '-'} ngày{task.effort === null ? '' : ` · ${task.effort} effort`}</strong></div>
      <div><span>Giai đoạn / vai trò</span><strong>{task.phase || '-'} · {task.departmentRole || '-'}</strong></div>
    </div>
    {task.description && <div className="local-pm-copy-block"><span>Mô tả</span><p>{task.description}</p></div>}
    {task.product && <div className="local-pm-copy-block"><span>Sản phẩm đầu ra</span><p>{task.product}</p></div>}
    <div className="local-pm-detail-list"><span>Người phụ trách</span>{item.assignees.length ? item.assignees.map(assignee => <div key={assignee.id}><strong>{assignee.assignee}</strong><small>{roleLabel(assignee.role)}</small></div>) : <p>Chưa có assignment.</p>}</div>
    <div className="local-pm-detail-list"><span>Phụ thuộc</span>{item.dependencies.length ? item.dependencies.map(dependency => <div key={dependency.id}><strong>{taskNames.get(dependency.dependsOnId) || `Task #${dependency.dependsOnId}`}</strong><small>{dependencyLabel(dependency.dependencyType)}{dependency.lagDays ? ` · lag ${dependency.lagDays} ngày` : ''}</small></div>) : <p>Không có phụ thuộc.</p>}</div>
    <div className="local-pm-copy-block"><span>Lịch sử trường dữ liệu</span>{item.logs.length ? <div className="table-scroll-x"><table className="data-table local-pm-log-table"><thead><tr><th>Thời gian</th><th>Người cập nhật</th><th>Trường</th><th>Thay đổi</th><th>Ghi chú</th></tr></thead><tbody>{item.logs.map(log => <tr key={log.id}><td>{formatDate(log.createdAt)}</td><td>{log.updatedBy}</td><td>{log.fieldName}</td><td>{log.oldValue || '∅'} → {log.newValue || '∅'}</td><td>{log.note || '-'}</td></tr>)}</tbody></table></div> : <p>Chưa có lịch sử.</p>}</div>
    <div className="local-pm-detail-list local-pm-collaboration-list"><span>Bình luận</span>{detailLoading && <p>Đang tải...</p>}{!detailLoading && !comments.length && <p>Chưa có bình luận.</p>}{comments.map(comment => <div className="local-pm-comment" key={comment.id}><strong>{comment.userLogin}</strong><small>{formatDate(comment.createdAt)}</small><p>{comment.comment}</p>{comment.replyCount > 0 && <button type="button" className="local-pm-inline-button" onClick={() => toggleReplies(comment.id)}>{openReplies === comment.id ? 'Ẩn replies' : `Xem replies (${comment.replyCount})`}</button>}{openReplies === comment.id && <div className="local-pm-replies">{repliesLoading === comment.id && <small>Đang tải replies...</small>}{(replies[comment.id] ?? []).map(reply => <div key={reply.id}><strong>{reply.userLogin}</strong><small>{formatDate(reply.createdAt)}</small><p>{reply.comment}</p></div>)}</div>}</div>)}</div>
    <div className="local-pm-detail-list local-pm-collaboration-list"><span>File đính kèm</span>{!detailLoading && !attachments.length && <p>Chưa có file đính kèm.</p>}{attachments.map(attachment => <div key={attachment.id}><a href={attachment.filePath} target="_blank" rel="noreferrer"><strong>{attachment.fileName}</strong></a><small>{attachment.userLogin} · {formatFileSize(attachment.fileSize)} · {formatDate(attachment.createdAt)}</small></div>)}</div>
    <div className="local-pm-detail-list local-pm-collaboration-list"><span>Activity log</span>{!detailLoading && !activities.length && <p>Chưa có activity.</p>}{activities.map(activity => <div key={activity.id}><strong>{activityLabel(activity.actionType)}</strong><small>{activity.userLogin} · {formatDate(activity.createdAt)}</small>{activity.description && <p>{activity.description}</p>}{activity.fieldName && <p>{activity.fieldName}: {activity.oldValue || '∅'} → {activity.newValue || '∅'}</p>}</div>)}</div>
    {detailError && <p className="error local-pm-analysis-error">{detailError}</p>}
    <footer className="local-pm-detail-footer"><span>Read-only target store · không ghi TFS/Jarvis.</span>{task.sourceUrl && <a href={task.sourceUrl} target="_blank" rel="noreferrer">Mở nguồn</a>}</footer>
  </article>;
}

export default function LocalProjectManagementPage() {
  const [searchParams] = useSearchParams();
  const requestedProjectId = Number(searchParams.get('projectId')) || null;
  const requestedSourceProjectId = Number(searchParams.get('sourceProjectId')) || null;
  const requestedSheetParam = searchParams.get('sheet');
  const requestedSheet: LocalProjectSheet = isLocalProjectSheet(requestedSheetParam) ? requestedSheetParam : 'overview';
  const requestedAnalysisParam = searchParams.get('analysis');
  const requestedAnalysis: LocalProjectAnalysis | null = isLocalProjectAnalysis(requestedAnalysisParam) ? requestedAnalysisParam : null;
  const [lastProjectId] = useState<number | null>(() => {
    try {
      const storedValue = window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY)
        || window.localStorage.getItem(LEGACY_LOCAL_PROJECT_STORAGE_KEY);
      const storedId = Number(storedValue);
      return Number.isFinite(storedId) && storedId > 0 ? storedId : null;
    } catch {
      return null;
    }
  });
  const [projects, setProjects] = useState<ProjectManagementProject[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeSheet, setActiveSheet] = useState<LocalProjectSheet>(requestedSheet);
  const [wbsView, setWbsView] = useState<'grid' | 'gantt'>('grid');
  const [workspace, setWorkspace] = useState<ProjectManagementWorkspace | null>(null);
  const [pmbok, setPmbok] = useState<ProjectManagementPmbokWorkspace | null>(null);
  const [criticalPath, setCriticalPath] = useState<ProjectManagementCriticalPath | null>(null);
  const [gantt, setGantt] = useState<ProjectManagementGantt | null>(null);
  const [baselines, setBaselines] = useState<ProjectManagementBaseline[] | null>(null);
  const [baselineComparison, setBaselineComparison] = useState<ProjectManagementBaselineComparison | null>(null);
  const [activityPage, setActivityPage] = useState<ProjectManagementActivityPage | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [pmbokLoading, setPmbokLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pmbokError, setPmbokError] = useState<string | null>(null);
  const [criticalPathLoading, setCriticalPathLoading] = useState(false);
  const [criticalPathError, setCriticalPathError] = useState<string | null>(null);
  const [ganttLoading, setGanttLoading] = useState(false);
  const [ganttError, setGanttError] = useState<string | null>(null);
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [baselineError, setBaselineError] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [workload, setWorkload] = useState<ProjectManagementWorkload | null>(null);
  const [workloadLoading, setWorkloadLoading] = useState(false);
  const [workloadError, setWorkloadError] = useState<string | null>(null);
  const [payments, setPayments] = useState<ProjectManagementPayment[] | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [otherCosts, setOtherCosts] = useState<ProjectManagementCostOther[] | null>(null);
  const [otherCostsLoading, setOtherCostsLoading] = useState(false);
  const [otherCostsError, setOtherCostsError] = useState<string | null>(null);
  const [pdca, setPdca] = useState<ProjectManagementPdca[] | null>(null);
  const [pdcaLoading, setPdcaLoading] = useState(false);
  const [pdcaError, setPdcaError] = useState<string | null>(null);
  const [requests, setRequests] = useState<ProjectManagementRequest[] | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [commissions, setCommissions] = useState<ProjectManagementCommission[] | null>(null);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [commissionsError, setCommissionsError] = useState<string | null>(null);
  const [paymentDocs, setPaymentDocs] = useState<Record<number, ProjectManagementPaymentDocument[]>>({});
  const [paymentDocsLoading, setPaymentDocsLoading] = useState<number | null>(null);
  const [exportLoading, setExportLoading] = useState<'csv' | 'json' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const selectedProjectIdRef = useRef<number | null>(null);
  selectedProjectIdRef.current = selectedId;
  const isCurrentProject = (projectId: number) => selectedProjectIdRef.current === projectId;

  const loadProjects = () => {
    setLoading(true);
    setError(null);
    setPmbok(null);
    setPmbokError(null);
    setCriticalPath(null);
    setCriticalPathError(null);
    setGantt(null);
    setGanttError(null);
    setBaselines(null);
    setBaselineComparison(null);
    setBaselineError(null);
    setActivityPage(null);
    setActivityError(null);
    setWorkload(null);
    setWorkloadError(null);
    setPayments(null);
    setPaymentsError(null);
    setOtherCosts(null);
    setOtherCostsError(null);
    setPdca(null);
    setPdcaError(null);
    setRequests(null);
    setRequestsError(null);
    setCommissions(null);
    setCommissionsError(null);
    setPaymentDocs({});
    void getProjectManagementProjects().then(result => {
      setProjects(result);
      setSelectedId(current => {
        if (requestedProjectId !== null) return result.some(project => project.id === requestedProjectId) ? requestedProjectId : null;
        if (requestedSourceProjectId !== null) return result.find(project => project.sourceProjectId === requestedSourceProjectId)?.id ?? null;
        if (lastProjectId && result.some(project => project.id === lastProjectId)) return lastProjectId;
        return current && result.some(project => project.id === current) ? current : null;
      });
    }).catch(exception => setError(exception instanceof Error ? exception.message : 'Không tải được project đích.')).finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    if (requestedProjectId === null && requestedSourceProjectId === null) return;
    const requestedProject = requestedProjectId !== null
      ? projects.find(project => project.id === requestedProjectId)
      : projects.find(project => project.sourceProjectId === requestedSourceProjectId);
    const nextId = requestedProject?.id ?? null;
    setSelectedId(current => current === nextId ? current : nextId);
    setActiveSheet(requestedSheet);
  }, [projects, requestedProjectId, requestedSheet, requestedSourceProjectId]);

  useEffect(() => {
    if (!selectedId) return;
    try {
      window.localStorage.setItem(LOCAL_PROJECT_STORAGE_KEY, String(selectedId));
    } catch {
      // localStorage may be unavailable in private or restricted browser contexts.
    }
  }, [selectedId]);

  useEffect(() => {
    setPmbokLoading(false);
    setCriticalPathLoading(false);
    setGanttLoading(false);
    setBaselineLoading(false);
    setActivityLoading(false);
    setWorkloadLoading(false);
    setPaymentsLoading(false);
    setOtherCostsLoading(false);
    setPdcaLoading(false);
    setRequestsLoading(false);
    setCommissionsLoading(false);
    setPaymentDocsLoading(null);
    setExportLoading(null);
    if (!selectedId) {
      setWorkspaceLoading(false);
      setWorkspace(null);
      setPmbok(null);
      setCriticalPath(null);
      setCriticalPathError(null);
      setGantt(null);
      setGanttError(null);
      setBaselines(null);
      setBaselineComparison(null);
      setBaselineError(null);
      setActivityPage(null);
      setActivityError(null);
      return;
    }
    let active = true;
    setWorkspaceLoading(true);
    setError(null);
    setPmbok(null);
    setPmbokError(null);
    setCriticalPath(null);
    setCriticalPathError(null);
    setGantt(null);
    setGanttError(null);
    setBaselines(null);
    setBaselineComparison(null);
    setBaselineError(null);
    setActivityPage(null);
    setActivityError(null);
    setWorkload(null);
    setWorkloadError(null);
    setPayments(null);
    setPaymentsError(null);
    setOtherCosts(null);
    setOtherCostsError(null);
    setPdca(null);
    setPdcaError(null);
    setRequests(null);
    setRequestsError(null);
    setCommissions(null);
    setCommissionsError(null);
    setPaymentDocs({});
    setSelectedTaskId(null);
    setPmbokLoading(true);
    void getProjectManagementPmbokWorkspace(selectedId)
      .then(result => { if (isCurrentProject(selectedId)) setPmbok(result); })
      .catch(exception => { if (isCurrentProject(selectedId)) setPmbokError(exception instanceof Error ? exception.message : 'Không tải được PMBOK workspace.'); })
      .finally(() => { if (isCurrentProject(selectedId)) setPmbokLoading(false); });
    void getProjectManagementWorkspace(selectedId).then(result => { if (active) setWorkspace(result); }).catch(exception => { if (active) setError(exception instanceof Error ? exception.message : 'Không tải được workspace PM.'); }).finally(() => { if (active) setWorkspaceLoading(false); });
    return () => { active = false; };
  }, [selectedId]);

  const loadPmbok = () => {
    if (!selectedId) return;
    const projectId = selectedId;
    setPmbokLoading(true);
    setPmbokError(null);
    void getProjectManagementPmbokWorkspace(projectId)
      .then(result => { if (isCurrentProject(projectId)) setPmbok(result); })
      .catch(exception => { if (isCurrentProject(projectId)) setPmbokError(exception instanceof Error ? exception.message : 'Không tải được PMBOK workspace.'); })
      .finally(() => { if (isCurrentProject(projectId)) setPmbokLoading(false); });
  };

  const loadCriticalPath = () => {
    if (!selectedId) return;
    const projectId = selectedId;
    setCriticalPathLoading(true);
    setCriticalPathError(null);
    void getProjectManagementCriticalPath(projectId)
      .then(result => { if (isCurrentProject(projectId)) setCriticalPath(result); })
      .catch(exception => { if (isCurrentProject(projectId)) setCriticalPathError(exception instanceof Error ? exception.message : 'Không tải được critical path target.'); })
      .finally(() => { if (isCurrentProject(projectId)) setCriticalPathLoading(false); });
  };

  const loadGantt = () => {
    if (!selectedId) return;
    const projectId = selectedId;
    setGanttLoading(true);
    setGanttError(null);
    void getProjectManagementGantt(projectId)
      .then(result => { if (isCurrentProject(projectId)) setGantt(result); })
      .catch(exception => { if (isCurrentProject(projectId)) setGanttError(exception instanceof Error ? exception.message : 'Không tải được Gantt target.'); })
      .finally(() => { if (isCurrentProject(projectId)) setGanttLoading(false); });
  };

  const loadBaselines = () => {
    if (!selectedId) return;
    const projectId = selectedId;
    setBaselineLoading(true);
    setBaselineError(null);
    void getProjectManagementBaselines(projectId)
      .then(result => { if (isCurrentProject(projectId)) setBaselines(result); })
      .catch(exception => { if (isCurrentProject(projectId)) setBaselineError(exception instanceof Error ? exception.message : 'Không tải được baseline target.'); })
      .finally(() => { if (isCurrentProject(projectId)) setBaselineLoading(false); });
  };

  const compareBaseline = (baselineName: string) => {
    if (!selectedId) return;
    const projectId = selectedId;
    setBaselineLoading(true);
    setBaselineError(null);
    void getProjectManagementBaselineComparison(projectId, baselineName)
      .then(result => { if (isCurrentProject(projectId)) setBaselineComparison(result); })
      .catch(exception => { if (isCurrentProject(projectId)) setBaselineError(exception instanceof Error ? exception.message : 'Không so sánh được baseline target.'); })
      .finally(() => { if (isCurrentProject(projectId)) setBaselineLoading(false); });
  };

  const loadActivity = (offset = 0) => {
    if (!selectedId) return;
    const projectId = selectedId;
    setActivityLoading(true);
    setActivityError(null);
    void getProjectManagementActivityPage(projectId, { limit: 30, offset })
      .then(result => { if (isCurrentProject(projectId)) setActivityPage(result); })
      .catch(exception => { if (isCurrentProject(projectId)) setActivityError(exception instanceof Error ? exception.message : 'Không tải được activity log target.'); })
      .finally(() => { if (isCurrentProject(projectId)) setActivityLoading(false); });
  };

  const loadWorkload = () => {
    if (!selectedId) return;
    const projectId = selectedId;
    setWorkloadLoading(true);
    setWorkloadError(null);
    void getProjectManagementWorkload({ projectId })
      .then(result => { if (isCurrentProject(projectId)) setWorkload(result); })
      .catch(exception => { if (isCurrentProject(projectId)) setWorkloadError(exception instanceof Error ? exception.message : 'Không tải được workload target.'); })
      .finally(() => { if (isCurrentProject(projectId)) setWorkloadLoading(false); });
  };

  const loadPayments = () => {
    if (!selectedId) return;
    const projectId = selectedId;
    setPaymentsLoading(true);
    setPaymentsError(null);
    void getProjectManagementPayments(projectId)
      .then(result => { if (isCurrentProject(projectId)) setPayments(result); })
      .catch(exception => { if (isCurrentProject(projectId)) setPaymentsError(exception instanceof Error ? exception.message : 'Không tải được thanh toán target.'); })
      .finally(() => { if (isCurrentProject(projectId)) setPaymentsLoading(false); });
  };

  const loadOtherCosts = () => {
    if (!selectedId) return;
    const projectId = selectedId;
    setOtherCostsLoading(true);
    setOtherCostsError(null);
    void getProjectManagementCostsOther(projectId)
      .then(result => { if (isCurrentProject(projectId)) setOtherCosts(result); })
      .catch(exception => { if (isCurrentProject(projectId)) setOtherCostsError(exception instanceof Error ? exception.message : 'Không tải được chi phí khác target.'); })
      .finally(() => { if (isCurrentProject(projectId)) setOtherCostsLoading(false); });
  };

  const loadPdca = () => {
    if (!selectedId) return;
    const projectId = selectedId;
    setPdcaLoading(true);
    setPdcaError(null);
    void getProjectManagementPdca(projectId)
      .then(result => { if (isCurrentProject(projectId)) setPdca(result); })
      .catch(exception => { if (isCurrentProject(projectId)) setPdcaError(exception instanceof Error ? exception.message : 'Không tải được PDCA target.'); })
      .finally(() => { if (isCurrentProject(projectId)) setPdcaLoading(false); });
  };

  const loadRequests = () => {
    if (!selectedId) return;
    const projectId = selectedId;
    setRequestsLoading(true);
    setRequestsError(null);
    void getProjectManagementRequests(projectId)
      .then(result => { if (isCurrentProject(projectId)) setRequests(result); })
      .catch(exception => { if (isCurrentProject(projectId)) setRequestsError(exception instanceof Error ? exception.message : 'Không tải được đề xuất target.'); })
      .finally(() => { if (isCurrentProject(projectId)) setRequestsLoading(false); });
  };

  const loadCommissions = () => {
    if (!selectedId) return;
    const projectId = selectedId;
    setCommissionsLoading(true);
    setCommissionsError(null);
    void getProjectManagementCommissions(projectId)
      .then(result => { if (isCurrentProject(projectId)) setCommissions(result); })
      .catch(exception => { if (isCurrentProject(projectId)) setCommissionsError(exception instanceof Error ? exception.message : 'Không tải được hoa hồng target.'); })
      .finally(() => { if (isCurrentProject(projectId)) setCommissionsLoading(false); });
  };

  const loadPaymentDocuments = (paymentId: number) => {
    if (paymentDocs[paymentId]) return;
    if (!selectedId) return;
    const projectId = selectedId;
    setPaymentDocsLoading(paymentId);
    void getProjectManagementPaymentDocuments(paymentId)
      .then(result => { if (isCurrentProject(projectId)) setPaymentDocs(current => ({ ...current, [paymentId]: result })); })
      .finally(() => { if (isCurrentProject(projectId)) setPaymentDocsLoading(null); });
  };

  const exportTasks = (format: 'csv' | 'json') => {
    if (!selectedId) return;
    const projectId = selectedId;
    setExportLoading(format);
    setExportError(null);
    void downloadProjectManagementExport(projectId, format)
      .then(blob => {
        if (!isCurrentProject(projectId)) return;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `tasks_project_${projectId}.${format}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      })
      .catch(exception => { if (isCurrentProject(projectId)) setExportError(exception instanceof Error ? exception.message : 'Không xuất được task.'); })
      .finally(() => { if (isCurrentProject(projectId)) setExportLoading(null); });
  };

  useEffect(() => {
    if (!selectedId || !requestedAnalysis) return;
    setActiveSheet('overview');
    if (requestedAnalysis === 'workload') loadWorkload();
    if (requestedAnalysis === 'critical-path') loadCriticalPath();
    if (requestedAnalysis === 'baseline') loadBaselines();
    if (requestedAnalysis === 'activity') loadActivity(0);
  }, [requestedAnalysis, selectedId]);

  const selectedTask = workspace?.tasks.find(item => item.task.id === selectedTaskId) ?? null;
  // The source screen has one project selector. Keep the target shell equally
  // deterministic instead of filtering a second, hidden project list.
  const filteredProjects = useMemo(() => sortProjectManagementProjects(projects), [projects]);
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
  const taskParentById = useMemo(() => new Map((workspace?.tasks ?? []).map(item => [item.task.id, item.task.parentId])), [workspace]);
  const taskHasChildren = useMemo(() => new Set((workspace?.tasks ?? []).map(item => item.task.parentId).filter((id): id is number => id !== null)), [workspace]);
  const visibleTasks = useMemo(() => (workspace?.tasks ?? []).filter(item => {
    let parentId = item.task.parentId;
    const seen = new Set<number>();
    while (parentId !== null && !seen.has(parentId)) {
      if (collapsedTaskIds.has(parentId)) return false;
      seen.add(parentId);
      parentId = taskParentById.get(parentId) ?? null;
    }
    return true;
  }), [collapsedTaskIds, taskParentById, workspace]);
  useEffect(() => { setCollapsedTaskIds(new Set()); }, [workspace?.project.id]);
  const stats = useMemo(() => {
    const tasks = workspace?.tasks ?? [];
    const progress = tasks.length ? Math.round(tasks.reduce((sum, item) => sum + item.task.progress, 0) / tasks.length) : 0;
    return { tasks: tasks.length, completed: tasks.filter(item => item.task.progress >= 100 || item.task.status === 3).length, progress, dependencies: tasks.reduce((sum, item) => sum + item.dependencies.length, 0), logs: tasks.reduce((sum, item) => sum + item.logs.length, 0) };
  }, [workspace]);
  const flowStatuses = useMemo(() => workspace
    ? Object.fromEntries(buildFlow(workspace, pmbok).map(step => [step.key, step.status]))
    : {}, [pmbok, workspace]);
  const flowSteps = useMemo(() => workspace ? buildFlow(workspace, pmbok) : [], [pmbok, workspace]);
  // Jarvis calculates setup_percent over every setup section and gives an
  // unavailable section zero, instead of removing it from the denominator.
  const flowSetupSteps = flowSteps.filter(step => step.kind === 'setup');
  const setupPercent = flowSetupSteps.length
    ? Math.round(flowSetupSteps.reduce((sum, step) => sum + step.percent, 0) / flowSetupSteps.length)
    : 0;
  const executionPercent = flowSteps.find(step => step.key === 'schedule')?.percent ?? stats.progress;
  const projectTitle = [workspace?.project.customer, workspace?.project.annexName || workspace?.project.projectCode || (workspace ? `Dự án #${workspace.project.id}` : '')]
    .filter(Boolean)
    .join(' — ');

  const openSheet = (key: typeof SOURCE_PM_SHEETS[number]['key'] | 'schedule') => {
    const sheetKey = key === 'schedule' ? 'wbs' : key;
    setActiveSheet(sheetKey);
    if (sheetKey !== 'overview' && sheetKey !== 'wbs' && !pmbok && !pmbokLoading) void loadPmbok();
  };

  useEffect(() => {
    requestAnimationFrame(() => document.querySelector('.local-pm-page')?.scrollIntoView({ behavior: 'auto', block: 'start' }));
  }, [activeSheet, pmbok]);

  useEffect(() => {
    if (!requestedAnalysis) return;
    const selectors: Record<LocalProjectAnalysis, string> = {
      workload: '.local-pm-workload',
      'critical-path': '.local-pm-critical-path',
      baseline: '.local-pm-baseline',
      activity: '.local-pm-activity',
      export: '.local-pm-export-toolbar',
    };
    requestAnimationFrame(() => document.querySelector(selectors[requestedAnalysis])?.scrollIntoView({ behavior: 'auto', block: 'start' }));
  }, [activityPage, baselines, criticalPath, requestedAnalysis, workload]);

  return <section className={`projectmanagement local-pm-page pm-sheet-${activeSheet} pm-wbs-view-${wbsView}${requestedAnalysis ? ` pm-analysis-${requestedAnalysis}` : ''}`}>
    <div className="projectmanagement-head"><div className="projectmanagement-head-left"><h1 className="projectmanagement-h1">Quản lý dự án</h1></div><div className="projectmanagement-proj"><label htmlFor="localPmProject">Dự án</label><select id="localPmProject" className="projectmanagement-select" value={selectedId ?? ""} onChange={event => { const nextId = Number(event.target.value) || null; setSelectedId(nextId); if (!nextId) { try { window.localStorage.removeItem(LOCAL_PROJECT_STORAGE_KEY); window.localStorage.removeItem(LEGACY_LOCAL_PROJECT_STORAGE_KEY); } catch { /* restricted storage */ } } setActiveSheet('overview'); }} disabled={loading || !filteredProjects.length}><option value="">— Chọn dự án —</option>{filteredProjects.map(project => <option key={project.id} value={project.id}>{projectManagementProjectLabel(project)}</option>)}</select></div></div>
    <nav className="pm-sheets source-pm-sheets" aria-label="Project management sheets" role="tablist">
      {SOURCE_PM_SHEETS.map(sheet => <button key={sheet.key} type="button" role="tab" aria-selected={activeSheet === sheet.key} className={`pm-sheet-tab${activeSheet === sheet.key ? ' active' : ''}`} onClick={() => openSheet(sheet.key)}>{sheet.label}{sheet.key !== 'overview' && <span className={`st-dot s-${flowStatuses[sheet.key === 'wbs' ? 'wbs' : sheet.key] ?? 'na'}`} aria-hidden="true" />}</button>)}
    </nav>
    {error && <p className="error">{error}</p>}
    {loading && <EmptySection text="Đang tải danh sách project đích…" />}
    {!loading && !projects.length && !error && <EmptySection text="Chưa có project đích. Có thể chạy migration rồi nạp fixture target-only theo runbook." />}
    {!loading && projects.length > 0 && !selectedId && <EmptySection text={requestedSourceProjectId !== null ? `Chưa có project đích được liên kết với TFS project #${requestedSourceProjectId}.` : requestedProjectId !== null ? `Không tìm thấy project đích #${requestedProjectId}.` : 'Chọn dự án để xem dòng chảy quản lý dự án.'} />}
    {workspaceLoading && <EmptySection text="Đang tải toàn bộ workspace PM…" />}
    {workspace && !workspaceLoading && <>
      <div className="projectmanagement-summary"><div className="sb-proj"><div className="t" title={projectTitle}>{projectTitle}</div><div className="m">PM: {workspace.project.projectManager || '—'} · Ngân sách: {formatMoney(workspace.project.budget)}</div></div><div className="sb-kpi"><div className="k">Hồ sơ PMBOK</div><div className="v">{setupPercent}<small>%</small></div><div className="bar"><i style={{ width: `${setupPercent}%` }} /></div></div><div className="sb-kpi exec"><div className="k">Tiến độ thực thi</div><div className="v">{executionPercent}<small>%</small></div><div className="bar"><i style={{ width: `${executionPercent}%` }} /></div></div></div>
      <div className="local-pm-analysis-toolbar"><div><span className="card-label">Resource allocation</span><strong>Workload theo người</strong><small>Đúng logic Jarvis: task giao trong kỳ, ngày làm việc chỉ tính Thứ 2–Thứ 6.</small></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadWorkload} disabled={workloadLoading}>{workloadLoading ? 'Đang tải workload...' : workload ? 'Tải lại workload' : 'Mở workload'}</button></div>
      {workloadError && <p className="error local-pm-analysis-error">{workloadError}</p>}
      {workload && <section className="platform-card local-pm-workload"><header><div><span className="card-label">Resource allocation</span><h3>{workload.startDate} → {workload.endDate}</h3></div><span className="local-pm-readonly-pill">{workload.workingDays} ngày làm việc · Read-only</span></header>{workload.resources.length ? <div className="table-scroll-x"><table className="data-table"><thead><tr><th>Người phụ trách</th><th>Tổng task</th><th>Đang làm</th><th>Hoàn tất</th><th>Quá hạn</th><th>Tiến độ TB</th><th>Utilization</th><th>Task trong kỳ</th></tr></thead><tbody>{workload.resources.map(resource => <tr key={resource.assignee}><td><strong>{resource.assignee}</strong></td><td>{resource.totalTasks}</td><td>{resource.activeTasks}</td><td>{resource.completedTasks}</td><td>{resource.overdueTasks}</td><td>{Math.round(resource.averageProgress)}%</td><td>{resource.utilization}%</td><td><details><summary>Xem {resource.tasks.length} task</summary><div className="local-pm-workload-tasks">{resource.tasks.map(task => <span key={task.id}><strong>{task.taskCode}</strong> {task.taskName} · {Math.round(task.progress)}%</span>)}</div></details></td></tr>)}</tbody></table></div> : <EmptySection text="Không có task được giao trong kỳ." />}</section>}
      <div className="local-pm-analysis-toolbar"><div><span className="card-label">Project payments</span><strong>Tiến độ thanh toán</strong><small>Projection read-only theo `pm_project_payment`; hồ sơ chỉ hiển thị số lượng, không mở file hay thao tác ghi.</small></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadPayments} disabled={paymentsLoading}>{paymentsLoading ? 'Đang tải thanh toán...' : payments ? 'Tải lại thanh toán' : 'Mở thanh toán'}</button></div>
      {paymentsError && <p className="error local-pm-analysis-error">{paymentsError}</p>}
      {payments && <section className="platform-card local-pm-payments"><header><div><span className="card-label">Project payments</span><h3>{payments.length} đợt thanh toán</h3></div><span className="local-pm-readonly-pill">Read-only</span></header>{payments.length ? <div className="table-scroll-x"><table className="data-table"><thead><tr><th>Đợt</th><th>Ngày xử lý</th><th>Ngày hóa đơn</th><th>Tỷ lệ</th><th>Số tiền</th><th>Trạng thái</th><th>Ngày thanh toán</th><th>Hồ sơ</th><th>Ghi chú</th></tr></thead><tbody>{payments.map(payment => <tr key={payment.id}><td><strong>#{payment.paymentNo}</strong></td><td>{formatDate(payment.processDate)}</td><td>{formatDate(payment.invoiceDate)}</td><td>{payment.paymentPercent}%</td><td>{formatMoney(payment.paymentAmount)}</td><td><span className="local-pm-status">{({ 0: 'Chờ xử lý', 1: 'Đang thực hiện', 2: 'Gửi khách hàng', 3: 'Đã hoàn tất' } as Record<number, string>)[payment.status] ?? `Mã ${payment.status}`}</span></td><td>{formatDate(payment.actualPaymentDate)}</td><td>{payment.documentCount} tài liệu</td><td>{payment.remarks || '—'}</td></tr>)}</tbody></table></div> : <EmptySection text="Project chưa có đợt thanh toán." />}</section>}
      <div className="local-pm-analysis-toolbar"><div><span className="card-label">Other project costs</span><strong>Chi phí khác</strong><small>Projection theo `pm_project_cost_other`; không bao gồm chi phí nhân sự, cost cache hoặc finance.</small></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadOtherCosts} disabled={otherCostsLoading}>{otherCostsLoading ? 'Đang tải chi phí...' : otherCosts ? 'Tải lại chi phí' : 'Mở chi phí khác'}</button></div>
      {otherCostsError && <p className="error local-pm-analysis-error">{otherCostsError}</p>}
      {otherCosts && <section className="platform-card local-pm-other-costs"><header><div><span className="card-label">Other project costs</span><h3>{otherCosts.length} khoản · {formatMoney(otherCosts.reduce((sum, item) => sum + item.amount, 0))}</h3></div><span className="local-pm-readonly-pill">Read-only</span></header>{otherCosts.length ? <div className="table-scroll-x"><table className="data-table"><thead><tr><th>Loại</th><th>Giai đoạn</th><th>Số tiền</th><th>Sản phẩm</th><th>Thực hiện bởi</th><th>Trạng thái</th><th>Cập nhật</th><th>Ghi chú</th></tr></thead><tbody>{otherCosts.map(cost => <tr key={cost.id}><td><strong>{cost.costType}</strong></td><td>{cost.phase}</td><td>{formatMoney(cost.amount)}</td><td>{cost.productType || '—'}</td><td>{cost.executorNotes || '—'}</td><td><span className="local-pm-status">{({ 0: 'Dự kiến', 1: 'Đang thực hiện', 2: 'Hoàn thành' } as Record<number, string>)[cost.status] ?? `Mã ${cost.status}`}</span></td><td>{formatDate(cost.updatedAt)}</td><td>{cost.remarks || '—'}</td></tr>)}</tbody></table></div> : <EmptySection text="Project chưa có chi phí khác." />}</section>}
      <div className="local-pm-analysis-toolbar"><div><span className="card-label">PDCA / Retro</span><strong>Vấn đề và phương án xử lý</strong><small>Projection từ `pm_project_pdca`; không tạo yêu cầu, không thay đổi trạng thái.</small></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadPdca} disabled={pdcaLoading}>{pdcaLoading ? 'Đang tải PDCA...' : pdca ? 'Tải lại PDCA' : 'Mở PDCA'}</button></div>
      {pdcaError && <p className="error local-pm-analysis-error">{pdcaError}</p>}
      {pdca && <section className="platform-card local-pm-pdca"><header><div><span className="card-label">PDCA / Retro</span><h3>{pdca.length} bản ghi</h3></div><span className="local-pm-readonly-pill">Read-only</span></header>{pdca.length ? <div className="local-pm-pdca-list">{pdca.map(item => <article key={item.id}><div className="local-pm-pdca-heading"><strong>{item.issueTitle}</strong><span>{formatDate(item.reportDate)} · {item.reporter}</span></div><p>{item.description || 'Chưa có mô tả.'}</p><div className="local-pm-pdca-meta"><span>Giải pháp: {item.solution || 'Chưa có'}</span><span>Trạng thái: {({ 0: 'Chưa xử lý', 1: 'Đang xử lý', 2: 'Đã xử lý' } as Record<number, string>)[item.processStatus] ?? `Mã ${item.processStatus}`}</span><span>Ngày xử lý: {formatDate(item.processDate)}</span></div>{item.notes && <small>{item.notes}</small>}</article>)}</div> : <EmptySection text="Project chưa có bản ghi PDCA." />}</section>}
      <div className="local-pm-analysis-toolbar"><div><span className="card-label">Project requests</span><strong>Đề xuất / yêu cầu của project</strong><small>Read-only theo `pm_project_requests`; không approve, reject hoặc chỉnh sửa.</small></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadRequests} disabled={requestsLoading}>{requestsLoading ? 'Đang tải đề xuất...' : requests ? 'Tải lại đề xuất' : 'Mở đề xuất'}</button></div>
      {requestsError && <p className="error local-pm-analysis-error">{requestsError}</p>}
      {requests && <section className="platform-card local-pm-requests"><header><div><span className="card-label">Project requests</span><h3>{requests.length} đề xuất</h3></div><span className="local-pm-readonly-pill">Read-only</span></header>{requests.length ? <div className="table-scroll-x"><table className="data-table"><thead><tr><th>Ngày</th><th>Loại / tiêu đề</th><th>Nội dung</th><th>Người tạo</th><th>Quản lý / duyệt</th><th>Số tiền</th><th>Trạng thái</th><th>Xử lý</th></tr></thead><tbody>{requests.map(item => <tr key={item.id}><td>{formatDate(item.requestDate)}</td><td><strong>{item.requestType}</strong><small>{item.title}</small></td><td>{item.content}<small>{item.notes || ''}</small></td><td>{item.member}</td><td>{item.manager || '—'} / {item.approver || '—'}</td><td>{item.amount === null ? '—' : formatMoney(item.amount)}</td><td><span className="local-pm-status">{({ 0: 'Tạo yêu cầu', 1: 'Đã duyệt', 2: 'Đang xử lý', 3: 'Đã xử lý', 4: 'Từ chối' } as Record<number, string>)[item.status] ?? `Mã ${item.status}`}</span></td><td>{formatDate(item.processedDate)}</td></tr>)}</tbody></table></div> : <EmptySection text="Project chưa có đề xuất." />}</section>}
      <div className="local-pm-analysis-toolbar"><div><span className="card-label">Commission</span><strong>Hoa hồng theo đợt thanh toán</strong><small>Projection liên kết payment–commission của Jarvis; không tự tính lại và không mở thao tác chi trả.</small></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadCommissions} disabled={commissionsLoading}>{commissionsLoading ? 'Đang tải hoa hồng...' : commissions ? 'Tải lại hoa hồng' : 'Mở hoa hồng'}</button></div>
      {commissionsError && <p className="error local-pm-analysis-error">{commissionsError}</p>}
      {commissions && <section className="platform-card local-pm-commissions"><header><div><span className="card-label">Commission</span><h3>{commissions.length} giao dịch · {formatMoney(commissions.reduce((sum, item) => sum + item.commissionAmount, 0))}</h3></div><span className="local-pm-readonly-pill">Read-only</span></header>{commissions.length ? <div className="table-scroll-x"><table className="data-table"><thead><tr><th>Payment</th><th>Tỷ lệ</th><th>Số tiền</th><th>Trạng thái</th><th>Ngày dự kiến</th><th>Ngày thực tế</th><th>Người nhận</th><th>Ghi chú</th></tr></thead><tbody>{commissions.map(item => <tr key={item.id}><td><strong>Đợt #{item.paymentNo}</strong><small>Payment #{item.paymentId}</small></td><td>{item.commissionPercent}%</td><td>{formatMoney(item.commissionAmount)}</td><td><span className="local-pm-status">{({ 0: 'Chưa trả', 1: 'Đang xử lý', 3: 'Đã trả' } as Record<number, string>)[item.status] ?? `Mã ${item.status}`}</span></td><td>{formatDate(item.expectedDate)}</td><td>{formatDate(item.actualDate)}</td><td>{item.recipientInfo || '—'}</td><td>{item.remarks || '—'}</td></tr>)}</tbody></table></div> : <EmptySection text="Project chưa có hoa hồng." />}</section>}
      <div id="local-pm-flow"><LocalProjectManagementFlow workspace={workspace} pmbok={pmbok} pmbokLoading={pmbokLoading} onOpenStep={key => openSheet(key as typeof SOURCE_PM_SHEETS[number]['key'] | 'schedule')} /></div>
      <div className="source-task-toolbar local-pm-wbs-viewbar"><div className="toolbar-filters"><strong>Tiến độ dự án</strong><span className="local-pm-wbs-count">{workspace.tasks.length} task · {workspace.tasks.filter(item => item.task.status === 3).length} hoàn tất</span></div><div className="source-view-toggle" role="group" aria-label="Chế độ hiển thị WBS"><button type="button" className={`btn${wbsView === 'grid' ? ' active' : ''}`} onClick={() => setWbsView('grid')}>Danh sách</button><button type="button" className={`btn${wbsView === 'gantt' ? ' active' : ''}`} onClick={() => { setWbsView('gantt'); if (!gantt && !ganttLoading) void loadGantt(); }}>{ganttLoading ? 'Đang tải...' : 'Gantt'}</button></div></div>
      <div className="local-pm-analysis-toolbar"><div><span className="card-label">WBS analysis</span><strong>Đường găng (Critical Path)</strong><small>Tính theo task và dependency target, chỉ đọc.</small></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadCriticalPath} disabled={criticalPathLoading}>{criticalPathLoading ? 'Đang tính...' : criticalPath ? 'Tính lại đường găng' : 'Mở đường găng'}</button></div>
      {criticalPathError && <p className="error local-pm-analysis-error">{criticalPathError}</p>}
      {criticalPath && <section className="platform-card local-pm-critical-path"><header><div><span className="card-label">Critical Path</span><h3>Đường găng của project</h3></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setCriticalPath(null)}>Ẩn</button></header><div className="local-pm-critical-stats"><div><strong>{criticalPath.projectDuration}</strong><span>Tổng thời gian (ngày)</span></div><div><strong>{criticalPath.criticalPath.length}</strong><span>Tasks trên đường găng</span></div></div><div className="local-pm-critical-list"><h4>Đường găng (Critical Path)</h4>{criticalPath.criticalPath.length ? <div className="local-pm-critical-items">{criticalPath.criticalPath.map((task, index) => <span key={task.id}><span className="local-pm-critical-item"><b>{task.taskCode}</b><strong>{task.taskName}</strong><small>{task.duration}d</small></span>{index < criticalPath.criticalPath.length - 1 && <i aria-hidden="true">→</i>}</span>)}</div> : <EmptySection text="Project chưa có task trên đường găng." />}</div></section>}
      <div className="local-pm-analysis-toolbar"><div><span className="card-label">WBS view</span><strong>Gantt Chart</strong><small>Lịch kế hoạch, hierarchy, progress và dependency của target; chỉ đọc.</small></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadGantt} disabled={ganttLoading}>{ganttLoading ? 'Đang tải Gantt...' : gantt ? 'Tải lại Gantt' : 'Mở Gantt'}</button></div>
      {ganttError && <p className="error local-pm-analysis-error">{ganttError}</p>}
      {gantt && <LocalProjectManagementGantt data={gantt} onSelectTask={setSelectedTaskId} />}
      <div className="local-pm-analysis-toolbar"><div><span className="card-label">Baseline</span><strong>So sánh Baseline</strong><small>{workspace.project.activeBaseline ? `Active: ${workspace.project.activeBaseline}` : 'Lịch sử kế hoạch của task, chỉ đọc.'}</small></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadBaselines} disabled={baselineLoading}>{baselineLoading ? 'Đang tải...' : baselines ? 'Tải lại baseline' : 'Mở baseline'}</button></div>
      {baselineError && <p className="error local-pm-analysis-error">{baselineError}</p>}
      {baselines && <section className="platform-card local-pm-baseline"><header><div><span className="card-label">Baseline</span><h3>Lịch sử kế hoạch</h3></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setBaselines(null); setBaselineComparison(null); }}>Ẩn</button></header>{baselines.length ? <div className="local-pm-baseline-list">{baselines.map(baseline => <button type="button" key={`${baseline.baselineName}-${baseline.createdBy}`} className={`local-pm-baseline-item${workspace.project.activeBaseline === baseline.baselineName ? ' active' : ''}`} onClick={() => compareBaseline(baseline.baselineName)}><strong>{baseline.baselineName}</strong><span>{baseline.taskCount} tasks · {formatDate(baseline.createdAt)} · {baseline.createdBy}</span></button>)}</div> : <EmptySection text="Project chưa có baseline." />}{baselineComparison && <><div className="local-pm-baseline-heading"><div><span className="card-label">Comparison</span><h4>{baselineComparison.baselineName}</h4></div><span className="local-pm-readonly-pill">Read-only</span></div><div className="local-pm-baseline-summary"><div><strong>{baselineComparison.summary.totalTasks}</strong><span>Tổng task</span></div><div><strong>{baselineComparison.summary.tasksAhead}</strong><span>Sớm hơn</span></div><div><strong>{baselineComparison.summary.tasksOnTime}</strong><span>Đúng hạn</span></div><div><strong>{baselineComparison.summary.tasksBehind}</strong><span>Chậm hơn</span></div><div><strong>{baselineComparison.summary.averageEndVariance}d</strong><span>TB lệch ngày kết thúc</span></div></div><div className="table-scroll-x"><table className="data-table local-pm-baseline-table"><thead><tr><th>Task</th><th>Baseline end</th><th>Actual end</th><th>End variance</th><th>Duration variance</th><th>Progress</th></tr></thead><tbody>{baselineComparison.tasks.map(task => <tr key={task.id}><td><strong>{task.taskCode}</strong><small>{task.taskName}</small></td><td>{formatDate(task.plannedEnd)}</td><td>{formatDate(task.actualEnd)}</td><td><span className={`local-pm-variance ${varianceClass(task.endVariance)}`}>{varianceLabel(task.endVariance)}</span></td><td><span className={`local-pm-variance ${varianceClass(task.durationVariance)}`}>{varianceLabel(task.durationVariance)}</span></td><td>{task.progress}%</td></tr>)}</tbody></table></div></>}</section>}
      <div className="local-pm-analysis-toolbar"><div><span className="card-label">Activity log</span><strong>Lịch sử hoạt động của project</strong><small>Comments, attachment và thay đổi task; chỉ đọc.</small></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => loadActivity(0)} disabled={activityLoading}>{activityLoading ? 'Đang tải...' : activityPage ? 'Tải lại activity' : 'Mở activity log'}</button></div>
      {activityError && <p className="error local-pm-analysis-error">{activityError}</p>}
      {activityPage && <section className="platform-card local-pm-activity"><header><div><span className="card-label">Activity log</span><h3>{activityPage.total} hoạt động</h3></div><span className="local-pm-readonly-pill">Read-only</span></header>{activityPage.activities.length ? <div className="local-pm-activity-list">{activityPage.activities.map(activity => <article key={activity.id}><span className="local-pm-activity-dot" aria-hidden="true" /><div><strong>{activityLabel(activity.actionType)}</strong><small>{activity.userLogin} · {formatDate(activity.createdAt)}{activity.taskCode ? ` · ${activity.taskCode}` : ''}</small>{activity.description && <p>{activity.description}</p>}{activity.fieldName && <p>{activity.fieldName}: {activity.oldValue || '∅'} → {activity.newValue || '∅'}</p>}</div></article>)}</div> : <EmptySection text="Project chưa có activity." />}<footer className="local-pm-activity-footer"><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => loadActivity(Math.max(0, activityPage.offset - activityPage.limit))} disabled={activityLoading || activityPage.offset === 0}>Mới hơn</button><span>{activityPage.total ? `${activityPage.offset + 1}-${Math.min(activityPage.offset + activityPage.activities.length, activityPage.total)} / ${activityPage.total}` : '0 hoạt động'}</span><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => loadActivity(activityPage.offset + activityPage.limit)} disabled={activityLoading || activityPage.offset + activityPage.activities.length >= activityPage.total}>Cũ hơn</button></footer></section>}
      <div id="local-pm-wbs" className="local-pm-grid source-task-grid">
        <section className="platform-card local-pm-section local-pm-wbs"><header><div><span className="card-label">WBS / task</span><h3>Công việc và quan hệ</h3></div><span className="muted">Bấm một dòng để xem chi tiết</span></header>{workspace.tasks.length ? <div className="table-scroll-x"><table className="data-table project-tasks-table local-pm-wbs-table"><thead><tr><th className="col-sticky-left text-center">STT</th><th>Mã</th><th>Công việc</th><th>Sản phẩm</th><th>Phụ trách</th><th className="text-center">Bắt đầu</th><th className="text-center">Kết thúc</th><th>% Actual</th><th>% Plan</th><th>Trạng thái</th><th>Ưu tiên</th><th>Người tạo</th><th className="col-sticky-right text-center">Thao tác</th></tr></thead><tbody>{visibleTasks.map((item, index) => <tr key={item.task.id} className={selectedTaskId === item.task.id ? 'selected-row' : ''}><td className="col-sticky-left text-center">{index + 1}</td><td>{taskHasChildren.has(item.task.id) && <button type="button" className="local-pm-task-expand" aria-label={collapsedTaskIds.has(item.task.id) ? 'Mở nhóm task' : 'Thu gọn nhóm task'} onClick={() => setCollapsedTaskIds(current => { const next = new Set(current); if (next.has(item.task.id)) next.delete(item.task.id); else next.add(item.task.id); return next; })}>{collapsedTaskIds.has(item.task.id) ? '▸' : '▾'}</button>}<span className={`local-pm-priority-dot priority-${item.task.priority}`} title={({ 1: 'Thấp', 2: 'Trung bình', 3: 'Cao', 4: 'Khẩn cấp' } as Record<number, string>)[item.task.priority] || 'Trung bình'} />{item.task.taskCode}</td><td><button type="button" className="local-pm-task-link" onClick={() => setSelectedTaskId(item.task.id)} style={{ paddingLeft: `${(taskDepth.get(item.task.id) ?? 0) * 20}px` }}><strong>{item.task.taskName}</strong><small>{item.task.parentId ? `Con của ${taskNames.get(item.task.parentId) || `#${item.task.parentId}`}` : item.task.description || '—'}</small></button></td><td title={item.task.product || ''}>{item.task.product || '—'}</td><td>{item.assignees.length ? <div className="local-pm-assignee-avatars">{item.assignees.slice(0, 3).map(assignee => <span className="local-pm-assignee-avatar" key={assignee.id} title={roleLabel(assignee.role)}>{assignee.assignee.trim().slice(0, 2).toUpperCase()}</span>)}{item.assignees.length > 3 && <span className="local-pm-assignee-avatar local-pm-assignee-more">+{item.assignees.length - 3}</span>}</div> : '—'}</td><td className="text-center">{formatDate(item.task.startDate)}</td><td className="text-center">{formatDate(item.task.endDate)}</td><td><div className="local-pm-progress-cell"><div className="local-pm-progress"><span><i style={{ width: `${Math.max(0, Math.min(100, item.task.progress))}%` }} /></span><strong>{Math.round(item.task.progress)}%</strong></div></div></td><td><div className="local-pm-progress-cell"><div className="local-pm-progress plan"><span><i style={{ width: `${Math.max(0, Math.min(100, item.task.plan))}%` }} /></span><strong>{Math.round(item.task.plan)}%</strong></div></div></td><td><span className={`local-pm-status status-${item.task.status}`}>{statusLabel(item.task.status)}{item.task.isCritical ? ' · critical' : ''}</span></td><td><span className={`local-pm-priority-badge priority-${item.task.priority}`}>{({ 1: 'Thấp', 2: 'Trung bình', 3: 'Cao', 4: 'Khẩn cấp' } as Record<number, string>)[item.task.priority] || 'Trung bình'}</span></td><td>{item.task.createdBy || '—'}</td><td className="col-sticky-right text-center"><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedTaskId(item.task.id)}>Chi tiết</button></td></tr>)}</tbody></table></div> : <EmptySection text="Project chưa có task." />}</section>
        <div className="local-pm-side">{selectedTask ? <TaskDetail item={selectedTask} workspace={workspace} /> : <div className="platform-card local-pm-select-hint"><span className="project-progress-icon">?</span><h3>Chọn một task</h3><p>Assignment, phụ thuộc và log trường dữ liệu sẽ hiển thị ở đây.</p></div>}</div>
      </div>
      <div className="local-pm-tables"><section className="platform-card local-pm-section"><header><div><span className="card-label">Weekly plan</span><h3>Kế hoạch tuần</h3></div><span className="muted">{workspace.plans.length} dòng</span></header>{workspace.plans.length ? <div className="table-scroll-x"><table className="data-table"><thead><tr><th>Tuần</th><th>Nội dung</th><th>Khoảng thời gian</th><th>Hiện tại</th><th>Kế hoạch</th><th>Kết quả</th><th>Nguồn lực</th></tr></thead><tbody>{workspace.plans.map(plan => <tr key={plan.id}><td>W{plan.week}/{plan.year}</td><td><strong>{plan.taskDescription}</strong><small>{plan.customer || '—'} · {plan.remarks || '—'}</small></td><td>{formatDate(plan.fromDate)} → {formatDate(plan.toDate)}</td><td>{plan.currentProgress}%</td><td>{plan.planProgress}%</td><td>{plan.resultProgress === null ? '—' : `${plan.resultProgress}%`}<small>{plan.resultNotes || ''}</small></td><td>{plan.resource || '—'}</td></tr>)}</tbody></table></div> : <EmptySection text="Chưa có kế hoạch tuần." />}</section>
      <section className="platform-card local-pm-section"><header><div><span className="card-label">Project summary</span><h3>Tổng hợp tiến độ</h3></div><span className="muted">{workspace.summaries.length} dòng</span></header>{workspace.summaries.length ? <div className="table-scroll-x"><table className="data-table"><thead><tr><th>Tuần</th><th>Kế hoạch</th><th>Thực tế</th><th>Thời gian</th><th>Ghi chú</th><th>Nguồn lực</th></tr></thead><tbody>{workspace.summaries.map(summary => <tr key={summary.id}><td>W{summary.week ?? '—'}/{summary.year ?? '—'}</td><td>{summary.planPercent}%</td><td>{summary.actualPercent}%</td><td>{formatDate(summary.startDate)} → {formatDate(summary.endDate)}</td><td>{summary.notes || '—'}</td><td>{summary.resources || '—'}</td></tr>)}</tbody></table></div> : <EmptySection text="Chưa có summary tuần." />}</section></div>
      {!pmbok && pmbokLoading && activeSheet !== 'overview' && activeSheet !== 'wbs' && <EmptySection text="Đang tải PMBOK target…" />}
      {pmbokError && activeSheet !== 'overview' && activeSheet !== 'wbs' && <p className="error local-pm-pmbok-error">{pmbokError}</p>}
      {pmbok && <LocalProjectManagementPmbok data={pmbok} requestedTab={activeSheet === 'overview' || activeSheet === 'wbs' ? undefined : activeSheet as PmbokTabKey} />}
      <div className="local-pm-analysis-toolbar local-pm-export-toolbar"><div><span className="card-label">Export Tasks</span><strong>Xuất task của project</strong><small>Đúng các trường read-only của Jarvis; Import và template vẫn bị khóa.</small></div><div className="local-pm-export-actions"><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => exportTasks('csv')} disabled={exportLoading !== null}>{exportLoading === 'csv' ? 'Đang xuất CSV...' : 'Xuất CSV'}</button><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => exportTasks('json')} disabled={exportLoading !== null}>{exportLoading === 'json' ? 'Đang xuất JSON...' : 'Xuất JSON'}</button></div></div>
      {payments && <section className="platform-card local-pm-payment-docs-panel"><header><div><span className="card-label">Payment documents</span><h3>Metadata hồ sơ theo đợt</h3></div><span className="local-pm-readonly-pill">Read-only</span></header><div className="local-pm-payment-doc-buttons">{payments.map(payment => <button type="button" className="btn btn-outline-secondary btn-sm" key={payment.id} onClick={() => loadPaymentDocuments(payment.id)} disabled={paymentDocsLoading === payment.id}>{paymentDocsLoading === payment.id ? 'Đang tải...' : `Đợt #${payment.paymentNo} - ${payment.documentCount} hồ sơ`}</button>)}</div>{Object.entries(paymentDocs).map(([paymentId, docs]) => <div className="local-pm-payment-doc-list" key={paymentId}><strong>Payment #{paymentId}</strong>{docs.length ? docs.map(doc => <span key={doc.id}>{doc.docName} - {doc.remarks || '-'}</span>) : <span>Không có metadata hồ sơ.</span>}</div>)}</section>}
      <section className="platform-card local-pm-project-contract"><header><div><span className="card-label">Project contract fields</span><h3>Thông tin hợp đồng / bảo trì</h3></div><span className="local-pm-readonly-pill">Source parity</span></header><div className="local-pm-project-contract-grid"><div><span>Loại</span><strong>{workspace.project.contractType === 2 ? 'Bảo trì' : 'Hợp đồng'}</strong></div><div><span>Ngày ký</span><strong>{formatDate(workspace.project.signDate)}</strong></div><div><span>Nghiệm thu</span><strong>{formatDate(workspace.project.acceptanceDate)}</strong></div><div><span>Bảo hành</span><strong>{workspace.project.warrantyMonths === null ? '—' : `${workspace.project.warrantyMonths} tháng — hết ${formatDate(workspace.project.warrantyEndDate)}`}</strong></div><div><span>Phí bảo trì</span><strong>{workspace.project.maintenancePercent === null ? '—' : `${workspace.project.maintenancePercent}%`}</strong></div><div><span>Hành động tiếp theo</span><strong>{formatDate(workspace.project.nextActionDate)}</strong></div><div><span>Ngân sách (%)</span><strong>{workspace.project.percentBudget}%</strong></div><div><span>Hoa hồng cấu hình</span><strong>{workspace.project.commissionPercent === null ? '—' : `${workspace.project.commissionPercent}% — ${formatMoney(workspace.project.commissionAmount ?? 0)}`}</strong></div></div>{workspace.project.remarks && <p className="muted">{workspace.project.remarks}</p>}</section>
      {exportError && <p className="error local-pm-analysis-error">{exportError}</p>}
    </>}
  </section>;
}
