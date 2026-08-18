import { describe, expect, it, vi } from 'vitest';
import { downloadProjectManagementExport, getProjectManagementActivityPage, getProjectManagementBaselineComparison, getProjectManagementBaselines, getProjectManagementCommentReplies, getProjectManagementCommissions, getProjectManagementCostsOther, getProjectManagementGantt, getProjectManagementPaymentDocuments, getProjectManagementPayments, getProjectManagementPdca, getProjectManagementPlanPage, getProjectManagementProjectSummaries, getProjectManagementRequests, getProjectManagementSummary, getProjectManagementSummaryCustomers, getProjectManagementSummaryPage, getProjectManagementSummaryProjects, getProjectManagementTaskActivity, getProjectManagementTaskAttachments, getProjectManagementTaskComments, getProjectManagementTasks, getProjectManagementWorkload, projectManagementProjectLabel, sortProjectManagementProjects } from './projectManagementClient';

describe('project management client', () => {
  it('keeps source project labels and ordering in selectors', () => {
    const projects = [
      { id: 2, sourceProjectId: null, projectManager: 'pm', customer: '', projectCode: 'Z', annexNo: null, annexName: 'Unmapped', status: 0, amount: 0, contractType: 1, percentBudget: 0, budget: 0, startDate: null, endDate: null, signDate: null, acceptanceDate: null, warrantyMonths: null, warrantyEndDate: null, maintenancePercent: null, nextActionDate: null, remarks: null, commissionPercent: null, commissionAmount: null, activeBaseline: null },
      { id: 1, sourceProjectId: 10, projectManager: 'pm', customer: 'Customer A', projectCode: 'P-001', annexNo: 'ANN-001', annexName: 'Project A', status: 1, amount: 0, contractType: 1, percentBudget: 0, budget: 0, startDate: null, endDate: null, signDate: null, acceptanceDate: null, warrantyMonths: null, warrantyEndDate: null, maintenancePercent: null, nextActionDate: null, remarks: null, commissionPercent: null, commissionAmount: null, activeBaseline: null },
    ];

    expect(projectManagementProjectLabel(projects[1])).toBe('Customer A - ANN-001 || 1');
    expect(sortProjectManagementProjects(projects).map(project => project.id)).toEqual([1, 2]);
  });

  it('encodes the numeric project id and reads the target envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })));

    await expect(getProjectManagementTasks(42)).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/projects/42/tasks', { credentials: 'include' });
  });

  it('keeps the backend error code in the client error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'PROJECT_MANAGEMENT_STORE_DISABLED', message: 'disabled' } }), { status: 503 })));

    await expect(getProjectManagementTasks(42)).rejects.toThrow('disabled [PROJECT_MANAGEMENT_STORE_DISABLED]');
  });

  it('keeps development error detail and error id in the client error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'PROJECT_MANAGEMENT_QUERY_FAILED', message: 'query failed', detail: 'table pm_project_task is unavailable', errorId: 'err-42' } }), { status: 503 })));

    await expect(getProjectManagementTasks(42)).rejects.toThrow('query failed — table pm_project_task is unavailable [PROJECT_MANAGEMENT_QUERY_FAILED] (errorId: err-42)');
  });

  it('serializes target task-plan filters and reads the paged envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      success: true,
      data: { rows: [], total: 0, limit: 50, offset: 0, hasMore: false },
    }), { status: 200 }))));

    await expect(getProjectManagementPlanPage({ year: 2026, week: 34, projectId: 9901, sectionType: 2, sort: 'actual_percent', order: 'asc', limit: 50, offset: 0 })).resolves.toMatchObject({ total: 0, rows: [] });
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/task-plans?year=2026&week=34&projectId=9901&sectionType=2&sort=actual_percent&order=asc&limit=50&offset=0', { credentials: 'include' });
  });

  it('reads the target project summary endpoint through the same envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })));

    await expect(getProjectManagementProjectSummaries()).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/summary', { credentials: 'include' });
  });

  it('serializes weekly summary filters and reads the paged envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      success: true,
      data: { rows: [], total: 0, limit: 50, offset: 0, hasMore: false },
    }), { status: 200 }))));

    await expect(getProjectManagementSummaryPage({ year: 2026, week: 34, customer: 'SYNTHETIC CUSTOMER A', projectManager: 'fixture.pm', sectionType: 1, limit: 50, offset: 0 })).resolves.toMatchObject({ total: 0, rows: [] });
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/summaries?year=2026&week=34&customer=SYNTHETIC+CUSTOMER+A&projectManager=fixture.pm&sectionType=1&limit=50&offset=0', { credentials: 'include' });

    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }))));
    await expect(getProjectManagementSummaryCustomers()).resolves.toEqual([]);
    expect(fetch).toHaveBeenLastCalledWith('/api/v2/project-management/summary-customers', { credentials: 'include' });
    await expect(getProjectManagementSummaryProjects('SYNTHETIC CUSTOMER A')).resolves.toEqual([]);
    expect(fetch).toHaveBeenLastCalledWith('/api/v2/project-management/summary-projects?customer=SYNTHETIC%20CUSTOMER%20A', { credentials: 'include' });

    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ success: true, data: { summary: { id: 69902 }, projectRecordId: 9901 } }), { status: 200 }))));
    await expect(getProjectManagementSummary(69902)).resolves.toMatchObject({ summary: { id: 69902 }, projectRecordId: 9901 });
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/summaries/69902', { credentials: 'include' });
  });

  it('loads and compares read-only target baselines', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }))));

    await expect(getProjectManagementBaselines(9901)).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/projects/9901/baselines', { credentials: 'include' });

    await expect(getProjectManagementBaselineComparison(9901, 'Baseline 2026-08-01')).resolves.toEqual([]);
    expect(fetch).toHaveBeenLastCalledWith('/api/v2/project-management/projects/9901/baselines/compare?baselineName=Baseline+2026-08-01', { credentials: 'include' });
  });

  it('loads read-only task collaboration and activity endpoints', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }))));

    await expect(getProjectManagementTaskComments(19902)).resolves.toEqual([]);
    expect(fetch).toHaveBeenLastCalledWith('/api/v2/project-management/tasks/19902/comments', { credentials: 'include' });
    await expect(getProjectManagementCommentReplies(89901)).resolves.toEqual([]);
    await expect(getProjectManagementTaskAttachments(19902)).resolves.toEqual([]);
    await expect(getProjectManagementTaskActivity(19902)).resolves.toEqual([]);
    expect(fetch).toHaveBeenLastCalledWith('/api/v2/project-management/tasks/19902/activity-log?limit=30', { credentials: 'include' });
    await expect(getProjectManagementActivityPage(9901, { limit: 30, offset: 0 })).resolves.toEqual([]);
    expect(fetch).toHaveBeenLastCalledWith('/api/v2/project-management/projects/9901/activity-log?limit=30&offset=0', { credentials: 'include' });
  });

  it('loads the target read-only Gantt projection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ success: true, data: { project: {}, tasks: [], dependencies: [] } }), { status: 200 }))));

    await expect(getProjectManagementGantt(9901)).resolves.toMatchObject({ tasks: [], dependencies: [] });
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/projects/9901/gantt', { credentials: 'include' });
  });

  it('downloads the target task export through the authenticated endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('\uFEFFtask_code,task_name\nFIX-001,Discovery', { status: 200 })));

    const blob = await downloadProjectManagementExport(9901, 'csv');

    expect(blob).toBeInstanceOf(Blob);
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/projects/9901/export?format=csv', { credentials: 'include' });
  });

  it('serializes the read-only resource workload filters', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { resources: [] } }), { status: 200 })));

    await expect(getProjectManagementWorkload({ projectId: 9901, startDate: '2026-08-01', endDate: '2026-08-31' })).resolves.toMatchObject({ resources: [] });
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/workload?projectId=9901&startDate=2026-08-01&endDate=2026-08-31', { credentials: 'include' });
  });

  it('loads read-only project payments', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })));

    await expect(getProjectManagementPayments(9901)).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/projects/9901/payments', { credentials: 'include' });
  });

  it('loads read-only other project costs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })));

    await expect(getProjectManagementCostsOther(9901)).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/projects/9901/costs-other', { credentials: 'include' });
  });

  it('loads read-only project PDCA', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })));

    await expect(getProjectManagementPdca(9901)).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/projects/9901/pdca', { credentials: 'include' });
  });

  it('loads read-only project requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })));

    await expect(getProjectManagementRequests(9901)).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/projects/9901/requests', { credentials: 'include' });
  });

  it('loads read-only project commissions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })));

    await expect(getProjectManagementCommissions(9901)).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/projects/9901/commissions', { credentials: 'include' });
  });

  it('loads read-only payment document metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })));

    await expect(getProjectManagementPaymentDocuments(79901)).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/v2/project-management/payments/79901/documents', { credentials: 'include' });
  });
});
