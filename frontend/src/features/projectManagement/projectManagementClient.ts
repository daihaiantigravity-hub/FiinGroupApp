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
  budget: number;
  startDate: string | null;
  endDate: string | null;
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
  createdBy: string | null;
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

type ProjectManagementResponse<T> = { data?: T; error?: { code?: string; message?: string } };

async function readError(response: Response, fallback: string): Promise<Error> {
  const payload = await response.json().catch(() => ({})) as ProjectManagementResponse<unknown>;
  return new Error((payload.error?.message ?? fallback) + ' [' + (payload.error?.code ?? response.status) + ']');
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

export function getProjectManagementTasks(projectId: number): Promise<ProjectManagementTask[]> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/tasks', 'Unable to load project-management tasks.');
}

export function getProjectManagementWorkspace(projectId: number): Promise<ProjectManagementWorkspace> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/workspace', 'Unable to load the project-management workspace.');
}

export function getProjectManagementPmbokWorkspace(projectId: number): Promise<ProjectManagementPmbokWorkspace> {
  return get('/api/v2/project-management/projects/' + encodeURIComponent(projectId) + '/pmbok', 'Unable to load the PMBOK workspace.');
}
