export type TfsProject = {
  collection: string;
  id: string;
  name: string;
  description: string | null;
  state: string | null;
  url: string | null;
};
export type TfsTeam = { id: string; name: string; description: string | null; url: string | null };
export type TfsIteration = { id: string; name: string; path: string | null; timeFrame: string | null; url: string | null };
export type TfsWorkItem = { id: number; revision: number; title: string | null; workItemType: string | null; state: string | null; assignedTo: string | null; iterationPath: string | null; parentId: number | null; startDate: string | null; finishDate: string | null; targetDate: string | null; closedDate: string | null; statusCode: number; progress: number; plan: number; priorityCode: number; taskCode: string | null; product: string | null; createdBy: string | null; url: string | null; generatedFields?: Record<string, string> };
export type TfsWorkItemDetail = TfsWorkItem & { description: string | null; createdDate: string | null; changedDate: string | null; priority: string | null; tags: string | null; history: string | null };

type TfsProjectResponse = { data?: TfsProject; error?: { code?: string; message?: string } };

async function readError(response: Response, fallback: string): Promise<Error> {
  const payload = await response.json().catch(() => ({})) as TfsProjectResponse;
  return new Error((payload.error?.message ?? fallback) + ' [' + (payload.error?.code ?? response.status) + ']');
}

export async function getTfsProjects(): Promise<TfsProject[]> {
  const response = await fetch('/api/v2/tfs/projects', { credentials: 'include' });
  if (!response.ok) throw await readError(response, 'Unable to load TFS projects.');
  const payload = await response.json() as { data?: TfsProject[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function getTfsProject(project: TfsProject): Promise<TfsProject> {
  const query = new URLSearchParams({ collection: project.collection });
  const response = await fetch('/api/v2/tfs/projects/' + encodeURIComponent(project.id) + '?' + query, { credentials: 'include' });
  if (!response.ok) throw await readError(response, 'Unable to load TFS project details.');
  const payload = await response.json() as TfsProjectResponse;
  if (!payload.data) throw new Error('TFS project details are empty.');
  return payload.data;
}

async function getProjectData<T>(project: TfsProject, suffix: string): Promise<T> {
  const query = new URLSearchParams({ collection: project.collection });
  const separator = suffix.includes('?') ? '&' : '?';
  const response = await fetch('/api/v2/tfs/projects/' + encodeURIComponent(project.id) + '/' + suffix + separator + query, { credentials: 'include' });
  if (!response.ok) throw await readError(response, 'Unable to load TFS project data.');
  const payload = await response.json() as { data?: T };
  if (payload.data === undefined) throw new Error('TFS project data is empty.');
  return payload.data;
}

export const getTfsTeams = (project: TfsProject) => getProjectData<TfsTeam[]>(project, 'teams');
export const getTfsIterations = (project: TfsProject) => getProjectData<TfsIteration[]>(project, 'iterations');
export const getTfsWorkItems = (project: TfsProject, limit = 100, offset = 0) => getProjectData<{ collection: string; projectId: string; totalAvailable: number; items: TfsWorkItem[] }>(project, 'work-items?limit=' + limit + '&offset=' + offset + '&projectName=' + encodeURIComponent(project.name));
export const getTfsWorkItem = (project: TfsProject, workItemId: number) => getProjectData<TfsWorkItemDetail>(project, 'work-items/' + workItemId);
