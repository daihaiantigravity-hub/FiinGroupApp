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
