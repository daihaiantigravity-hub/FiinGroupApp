export type ProjectManagementProject = {
  id: number;
  sourceProjectId: number | null;
  projectManager: string;
  customer: string;
  projectCode: string | null;
  annexNo: string | null;
  annexName: string | null;
  status: number;
  amount: number;
  contractType: number;
  percentBudget: number;
  budget: number;
  startDate: string | null;
  endDate: string | null;
  signDate: string | null;
  acceptanceDate: string | null;
  warrantyMonths: number | null;
  warrantyEndDate: string | null;
  maintenancePercent: number | null;
  nextActionDate: string | null;
  remarks: string | null;
  commissionPercent: number | null;
  commissionAmount: number | null;
  activeBaseline: string | null;
};

export function projectManagementProjectLabel(project: ProjectManagementProject) {
  const customer = project.customer?.trim() || '';
  const projectName = project.annexNo?.trim() || project.projectCode?.trim() || project.annexName?.trim() || '';
  const idSuffix = ` || ${project.id}`;
  return customer
    ? `${customer} - ${projectName || `#${project.id}`}${idSuffix}`
    : `${project.id} - ${projectName || '—'}`;
}

export function sortProjectManagementProjects(projects: ProjectManagementProject[]) {
  return [...projects].sort((left, right) => {
    const leftMapped = left.customer ? 1 : 0;
    const rightMapped = right.customer ? 1 : 0;
    if (leftMapped !== rightMapped) return rightMapped - leftMapped;
    const customerOrder = (left.customer || '').localeCompare(right.customer || '');
    if (customerOrder !== 0) return customerOrder;
    const leftCode = left.annexNo || left.projectCode || left.annexName || '';
    const rightCode = right.annexNo || right.projectCode || right.annexName || '';
    const codeOrder = leftCode.localeCompare(rightCode);
    return codeOrder !== 0 ? codeOrder : right.id - left.id;
  });
}

export type ProjectManagementProjectSummary = {
  project: ProjectManagementProject;
  taskCount: number;
  completedTaskCount: number;
  activeTaskCount: number;
  overdueTaskCount: number;
  dependencyCount: number;
  planCount: number;
  averageProgress: number;
  latestPlanPercent: number;
  latestActualPercent: number;
  latestSummaryYear: number | null;
  latestSummaryWeek: number | null;
  latestSummaryNotes: string | null;
};

export type ProjectManagementTask = {
  id: number;
  projectId: number;
  parentId: number | null;
  taskCode: string;
  taskName: string;
  description: string | null;
  product: string | null;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  plan: number;
  priority: number;
  taskType: number;
  status: number;
  sortOrder: number;
  createdBy: string | null;
  sourceSystem: string | null;
  sourceCollection: string | null;
  sourceProjectId: string | null;
  sourceId: string | null;
  sourceRevision: number | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  duration: number;
  effort: number | null;
  isCritical: boolean;
  phase: string | null;
  departmentRole: string | null;
  sourceUrl: string | null;
};

export type ProjectManagementTaskAssignee = {
  id: number;
  taskId: number;
  assignee: string;
  role: number;
};

export type ProjectManagementTaskDependency = {
  id: number;
  taskId: number;
  dependsOnId: number;
  dependencyType: number;
  lagDays: number;
};

export type ProjectManagementTaskLog = {
  id: number;
  taskId: number;
  updatedBy: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  createdAt: string | null;
};

export type ProjectManagementTaskComment = {
  id: number;
  taskId: number;
  userLogin: string;
  comment: string;
  parentId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  replyCount: number;
};

export type ProjectManagementTaskAttachment = {
  id: number;
  taskId: number;
  userLogin: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  fileType: string | null;
  createdAt: string | null;
};

export type ProjectManagementTaskActivity = {
  id: number;
  projectId: number;
  taskId: number | null;
  userLogin: string;
  actionType: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string | null;
  createdAt: string | null;
  taskCode: string | null;
  taskName: string | null;
};

export type ProjectManagementActivityPage = {
  activities: ProjectManagementTaskActivity[];
  total: number;
  limit: number;
  offset: number;
};

export type ProjectManagementWorkloadTask = {
  id: number;
  taskCode: string;
  taskName: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  status: number;
  priority: number;
  projectId: number;
  projectName: string | null;
};

export type ProjectManagementWorkloadResource = {
  assignee: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeTasks: number;
  averageProgress: number;
  utilization: number;
  tasks: ProjectManagementWorkloadTask[];
};

export type ProjectManagementWorkload = {
  startDate: string;
  endDate: string;
  workingDays: number;
  resources: ProjectManagementWorkloadResource[];
};

export type ProjectManagementPayment = {
  id: number;
  projectId: number;
  paymentNo: number;
  processDate: string | null;
  invoiceDate: string | null;
  paymentPercent: number;
  paymentAmount: number;
  status: number;
  actualPaymentDate: string | null;
  remarks: string | null;
  documentCount: number;
};

export type ProjectManagementCostOther = {
  id: number;
  projectId: number;
  costType: string;
  phase: string;
  amount: number;
  executorNotes: string | null;
  productType: string | null;
  status: number;
  remarks: string | null;
  updatedAt: string | null;
};

export type ProjectManagementPdca = {
  id: number;
  projectId: number | null;
  reportDate: string;
  reporter: string;
  issueTitle: string;
  description: string | null;
  solution: string | null;
  processStatus: number;
  processDate: string | null;
  faultMembers: string | null;
  notes: string | null;
  updatedAt: string | null;
};

export type ProjectManagementRequest = {
  id: number;
  projectId: number | null;
  requestDate: string;
  member: string;
  manager: string | null;
  requestType: string;
  title: string;
  content: string;
  amount: number | null;
  reference: string | null;
  processedDate: string | null;
  status: number;
  approver: string | null;
  notes: string | null;
  updatedAt: string | null;
};

export type ProjectManagementCommission = {
  id: number;
  projectId: number;
  paymentId: number;
  paymentNo: number;
  commissionPercent: number;
  commissionAmount: number;
  status: number;
  remarks: string | null;
  expectedDate: string | null;
  recipientInfo: string | null;
  actualDate: string | null;
};

export type ProjectManagementPaymentDocument = {
  id: number;
  paymentId: number;
  docName: string;
  docStatus: number;
  attachment: string | null;
  remarks: string | null;
  updatedAt: string | null;
};

export type ProjectManagementCriticalPathTask = {
  id: number;
  taskCode: string;
  taskName: string;
  duration: number;
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  slack: number;
  isCritical: boolean;
};

export type ProjectManagementCriticalPath = {
  projectDuration: number;
  criticalPath: ProjectManagementCriticalPathTask[];
  allTasks: ProjectManagementCriticalPathTask[];
};

export type ProjectManagementGanttTask = {
  id: number;
  parentId: number | null;
  taskCode: string;
  taskName: string;
  startDate: string | null;
  endDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  duration: number;
  progress: number;
  priority: number;
  taskType: number;
  status: number;
  sortOrder: number;
  assignees: string[];
};

export type ProjectManagementGantt = {
  project: ProjectManagementProject;
  tasks: ProjectManagementGanttTask[];
  dependencies: ProjectManagementTaskDependency[];
};

export type ProjectManagementBaseline = {
  baselineName: string;
  createdBy: string;
  createdAt: string | null;
  taskCount: number;
};

export type ProjectManagementBaselineTask = {
  id: number;
  taskCode: string;
  taskName: string;
  actualStart: string | null;
  actualEnd: string | null;
  actualDuration: number;
  progress: number;
  status: number;
  plannedStart: string | null;
  plannedEnd: string | null;
  plannedDuration: number | null;
  startVariance: number | null;
  endVariance: number | null;
  durationVariance: number | null;
};

export type ProjectManagementBaselineSummary = {
  totalTasks: number;
  tasksAhead: number;
  tasksOnTime: number;
  tasksBehind: number;
  averageStartVariance: number;
  averageEndVariance: number;
};

export type ProjectManagementBaselineComparison = {
  baselineName: string;
  tasks: ProjectManagementBaselineTask[];
  summary: ProjectManagementBaselineSummary;
};

export type ProjectManagementTaskDetails = {
  task: ProjectManagementTask;
  assignees: ProjectManagementTaskAssignee[];
  dependencies: ProjectManagementTaskDependency[];
  logs: ProjectManagementTaskLog[];
};

export type ProjectManagementPlan = {
  id: number;
  year: number;
  month: number;
  week: number;
  sectionType: number;
  entryType: number;
  customer: string | null;
  projectId: number | null;
  taskDescription: string;
  fromDate: string | null;
  toDate: string | null;
  currentProgress: number;
  planProgress: number;
  resultProgress: number | null;
  resultNotes: string | null;
  resource: string | null;
  remarks: string | null;
  sortOrder: number;
  sourcePlanId: number | null;
  createdBy: string | null;
  createdAt: string | null;
  status: number;
};

export type ProjectManagementSummary = {
  id: number;
  projectManager: string | null;
  year: number | null;
  customer: string | null;
  projectId: number;
  annexName: string | null;
  planPercent: number;
  actualPercent: number;
  week: number | null;
  sectionType: number;
  entryType: number;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  resources: string | null;
  updatedBy: string | null;
  status: number;
};

export type ProjectManagementWorkspace = {
  project: ProjectManagementProject;
  tasks: ProjectManagementTaskDetails[];
  plans: ProjectManagementPlan[];
  summaries: ProjectManagementSummary[];
};

export type ProjectManagementPlanListItem = {
  plan: ProjectManagementPlan;
  projectRecordId: number | null;
  projectCode: string | null;
  annexNo: string | null;
  annexName: string | null;
  projectManager: string | null;
};

export type ProjectManagementPlanPage = {
  rows: ProjectManagementPlanListItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type ProjectManagementSummaryListItem = {
  summary: ProjectManagementSummary;
  projectRecordId: number | null;
  projectCode: string | null;
  annexNo: string | null;
  annexName: string | null;
  contractType: number | null;
  projectStatus: number | null;
  projectManager: string | null;
};

export type ProjectManagementSummaryPage = {
  rows: ProjectManagementSummaryListItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type ProjectManagementSummaryQuery = {
  year?: number;
  week?: number;
  projectId?: number;
  customer?: string;
  projectManager?: string;
  sectionType?: number;
  status?: number;
  limit?: number;
  offset?: number;
};

export type ProjectManagementSummaryProject = {
  id: number;
  sourceProjectId: number | null;
  annexNo: string | null;
  annexName: string | null;
  customer: string | null;
  projectManager: string | null;
  status: number;
  projectCode: string | null;
};

export type ProjectManagementPlanQuery = {
  year?: number;
  week?: number;
  projectId?: number;
  customer?: string;
  projectManager?: string;
  sectionType?: number;
  status?: number;
  sort?: ProjectManagementPlanSortField;
  order?: ProjectManagementPlanSortOrder;
  limit?: number;
  offset?: number;
};

export type ProjectManagementPlanSortField =
  | 'id' | 'year' | 'week' | 'section_type' | 'customer' | 'annex_no'
  | 'from_date' | 'plan_percent' | 'actual_percent' | 'task_desc'
  | 'result_notes' | 'resource' | 'created_by' | 'status' | 'created_at';

export type ProjectManagementPlanSortOrder = 'asc' | 'desc';

export type ProjectManagementCharter = {
  id: number;
  projectId: number;
  businessCase: string | null;
  objectives: string | null;
  inScope: string | null;
  outScope: string | null;
  deliverables: string | null;
  assumptions: string | null;
  constraints: string | null;
  highRisks: string | null;
  sponsor: string | null;
  productOwner: string | null;
  approvalStatus: number;
  approvedBy: string | null;
  approvedAt: string | null;
  status: number;
};

export type ProjectManagementStakeholder = {
  id: number;
  projectId: number;
  stakeholderType: string;
  member: string | null;
  partnerCode: string | null;
  name: string | null;
  role: string | null;
  power: string | null;
  interest: string | null;
  expectation: string | null;
  engagementStrategy: string | null;
  owner: string | null;
  status: number;
};

export type ProjectManagementResource = {
  id: number;
  projectId: number;
  member: string | null;
  role: string | null;
  subTeam: string | null;
  effort: number | null;
  unitRate: number | null;
  plannedMandays: number | null;
  status: number;
};

export type ProjectManagementRaci = {
  id: number;
  projectId: number;
  activity: string;
  role: string;
  raciValue: string | null;
  sortOrder: number;
  status: number;
};

export type ProjectManagementRisk = {
  id: number;
  projectId: number;
  riskCode: string | null;
  description: string | null;
  category: string | null;
  probability: number | null;
  impact: number | null;
  score: number;
  response: string | null;
  owner: string | null;
  triggerDescription: string | null;
  reviewDate: string | null;
  status: number;
};

export type ProjectManagementCostPlan = {
  id: number;
  projectId: number;
  itemName: string | null;
  description: string | null;
  amount: number | null;
  isContingency: boolean;
  contingencyPercent: number | null;
  sortOrder: number;
  status: number;
};

export type ProjectManagementQualityPlan = {
  id: number;
  projectId: number;
  criteria: string | null;
  appliesTo: string | null;
  verifyMethod: string | null;
  acceptanceStandard: string | null;
  owner: string | null;
  sortOrder: number;
  status: number;
};

export type ProjectManagementDefinitionOfDone = {
  id: number;
  projectId: number;
  itemText: string;
  sortOrder: number;
  status: number;
};

export type ProjectManagementCommunicationPlan = {
  id: number;
  projectId: number;
  activity: string | null;
  purpose: string | null;
  audience: string | null;
  frequency: string | null;
  channel: string | null;
  owner: string | null;
  sortOrder: number;
  status: number;
};

export type ProjectManagementChangeLog = {
  id: number;
  projectId: number;
  changeCode: string | null;
  changeDate: string | null;
  description: string | null;
  requestedBy: string | null;
  reason: string | null;
  impactScope: string | null;
  impactTime: string | null;
  impactCost: string | null;
  estimatedMandays: number | null;
  decision: number;
  approver: string | null;
  status: number;
};

export type ProjectManagementPmbokWorkspace = {
  charter: ProjectManagementCharter | null;
  stakeholders: ProjectManagementStakeholder[];
  resources: ProjectManagementResource[];
  raci: ProjectManagementRaci[];
  risks: ProjectManagementRisk[];
  costPlans: ProjectManagementCostPlan[];
  qualityPlans: ProjectManagementQualityPlan[];
  definitionOfDone: ProjectManagementDefinitionOfDone[];
  communicationPlans: ProjectManagementCommunicationPlan[];
  changeLogs: ProjectManagementChangeLog[];
};

type ProjectManagementResponse<T> = { data?: T; error?: { code?: string; message?: string; detail?: string; errorId?: string } };

async function readError(response: Response, fallback: string): Promise<Error> {
  const payload = await response.json().catch(() => ({})) as ProjectManagementResponse<unknown>;
  const error = payload.error;
  const message = error?.message ?? fallback;
  const detail = error?.detail && error.detail !== message ? ` — ${error.detail}` : '';
  const errorId = error?.errorId ? ` (errorId: ${error.errorId})` : '';
  return new Error(`${message}${detail} [${error?.code ?? response.status}]${errorId}`);
}

async function get<T>(path: string, fallback: string): Promise<T> {
  const response = await fetch(path, { credentials: 'include' });
  if (!response.ok) throw await readError(response, fallback);
  const payload = await response.json() as ProjectManagementResponse<T>;
  if (payload.data === undefined) throw new Error('Project-management response is empty.');
  return payload.data;
}

export function getProjectManagementProjects(): Promise<ProjectManagementProject[]> {
  return get('/api/v2/project-management/projects', 'Unable to load project-management projects.');
}

export function getProjectManagementProjectSummaries(): Promise<ProjectManagementProjectSummary[]> {
  return get('/api/v2/project-management/summary', 'Unable to load the target project summary.');
}

export function getProjectManagementSummaryPage(query: ProjectManagementSummaryQuery = {}): Promise<ProjectManagementSummaryPage> {
  const params = new URLSearchParams();
  if (query.year !== undefined) params.set('year', String(query.year));
  if (query.week !== undefined) params.set('week', String(query.week));
  if (query.projectId !== undefined) params.set('projectId', String(query.projectId));
  if (query.customer) params.set('customer', query.customer);
  if (query.projectManager) params.set('projectManager', query.projectManager);
  if (query.sectionType !== undefined) params.set('sectionType', String(query.sectionType));
  if (query.status !== undefined) params.set('status', String(query.status));
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const suffix = params.toString() ? '?' + params.toString() : '';
  return get('/api/v2/project-management/summaries' + suffix, 'Unable to load the target weekly summaries.');
}

export function getProjectManagementSummary(summaryId: number): Promise<ProjectManagementSummaryListItem> {
  return get('/api/v2/project-management/summaries/' + encodeURIComponent(summaryId), 'Unable to load the target weekly summary.');
}

export function getProjectManagementSummaryCustomers(): Promise<string[]> {
  return get('/api/v2/project-management/summary-customers', 'Unable to load target summary customers.');
}

export function getProjectManagementSummaryProjects(customer?: string): Promise<ProjectManagementSummaryProject[]> {
  const suffix = customer ? '?customer=' + encodeURIComponent(customer) : '';
  return get('/api/v2/project-management/summary-projects' + suffix, 'Unable to load target summary projects.');
}

export function getProjectManagementTasks(projectId: number): Promise<ProjectManagementTask[]> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/tasks', 'Unable to load project-management tasks.');
}

export function getProjectManagementWorkload(query: { projectId?: number; startDate?: string; endDate?: string } = {}): Promise<ProjectManagementWorkload> {
  const params = new URLSearchParams();
  if (query.projectId !== undefined) params.set('projectId', String(query.projectId));
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);
  const suffix = params.toString() ? '?' + params.toString() : '';
  return get('/api/v2/project-management/workload' + suffix, 'Unable to load project workload.');
}

export function getProjectManagementPayments(projectId: number): Promise<ProjectManagementPayment[]> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/payments', 'Unable to load project payments.');
}

export function getProjectManagementCostsOther(projectId: number): Promise<ProjectManagementCostOther[]> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/costs-other', 'Unable to load other project costs.');
}

export function getProjectManagementPdca(projectId: number): Promise<ProjectManagementPdca[]> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/pdca', 'Unable to load project PDCA.');
}

export function getProjectManagementRequests(projectId: number): Promise<ProjectManagementRequest[]> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/requests', 'Unable to load project requests.');
}

export function getProjectManagementCommissions(projectId: number): Promise<ProjectManagementCommission[]> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/commissions', 'Unable to load project commissions.');
}

export function getProjectManagementPaymentDocuments(paymentId: number): Promise<ProjectManagementPaymentDocument[]> {
  return get('/api/v2/project-management/payments/' + encodeURIComponent(paymentId) + '/documents', 'Unable to load payment documents.');
}

export function getProjectManagementCriticalPath(projectId: number): Promise<ProjectManagementCriticalPath> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/critical-path', 'Unable to load the target critical path.');
}

export function getProjectManagementGantt(projectId: number): Promise<ProjectManagementGantt> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/gantt', 'Unable to load the target Gantt view.');
}

export async function downloadProjectManagementExport(projectId: number, format: 'csv' | 'json'): Promise<Blob> {
  const response = await fetch('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/export?format=' + format, { credentials: 'include' });
  if (!response.ok) throw await readError(response, 'Unable to export target project tasks.');
  return response.blob();
}

export function getProjectManagementBaselines(projectId: number): Promise<ProjectManagementBaseline[]> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/baselines', 'Unable to load target baselines.');
}

export function getProjectManagementBaselineComparison(projectId: number, baselineName: string): Promise<ProjectManagementBaselineComparison> {
  const params = new URLSearchParams({ baselineName });
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/baselines/compare?' + params.toString(), 'Unable to compare the target baseline.');
}

export function getProjectManagementTaskComments(taskId: number): Promise<ProjectManagementTaskComment[]> {
  return get('/api/v2/project-management/tasks/' + encodeURIComponent(taskId) + '/comments', 'Unable to load task comments.');
}

export function getProjectManagementCommentReplies(commentId: number): Promise<ProjectManagementTaskComment[]> {
  return get('/api/v2/project-management/comments/' + encodeURIComponent(commentId) + '/replies', 'Unable to load comment replies.');
}

export function getProjectManagementTaskAttachments(taskId: number): Promise<ProjectManagementTaskAttachment[]> {
  return get('/api/v2/project-management/tasks/' + encodeURIComponent(taskId) + '/attachments', 'Unable to load task attachments.');
}

export function getProjectManagementTaskActivity(taskId: number, limit = 30): Promise<ProjectManagementTaskActivity[]> {
  return get('/api/v2/project-management/tasks/' + encodeURIComponent(taskId) + '/activity-log?limit=' + encodeURIComponent(limit), 'Unable to load task activity.');
}

export function getProjectManagementActivityPage(projectId: number, query: { taskId?: number; limit?: number; offset?: number } = {}): Promise<ProjectManagementActivityPage> {
  const params = new URLSearchParams();
  if (query.taskId !== undefined) params.set('taskId', String(query.taskId));
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));
  const suffix = params.toString() ? '?' + params.toString() : '';
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/activity-log' + suffix, 'Unable to load project activity.');
}

export function getProjectManagementWorkspace(projectId: number): Promise<ProjectManagementWorkspace> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/workspace', 'Unable to load the project-management workspace.');
}

export function getProjectManagementPlanPage(query: ProjectManagementPlanQuery = {}): Promise<ProjectManagementPlanPage> {
  const params = new URLSearchParams();
  const values: Array<[keyof ProjectManagementPlanQuery, string]> = [
    ['year', 'year'], ['week', 'week'], ['projectId', 'projectId'], ['customer', 'customer'],
    ['projectManager', 'projectManager'], ['sectionType', 'sectionType'], ['status', 'status'],
    ['sort', 'sort'], ['order', 'order'],
    ['limit', 'limit'], ['offset', 'offset'],
  ];
  for (const [key, name] of values) {
    const value = query[key];
    if (value !== undefined && value !== '') params.set(name, String(value));
  }
  const suffix = params.toString() ? '?' + params.toString() : '';
  return get('/api/v2/project-management/task-plans' + suffix, 'Unable to load the target task-plan list.');
}

export function getProjectManagementPmbokWorkspace(projectId: number): Promise<ProjectManagementPmbokWorkspace> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/pmbok', 'Unable to load the PMBOK workspace.');
}
