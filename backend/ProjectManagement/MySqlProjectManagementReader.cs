using MySqlConnector;

namespace FiinGroupApp.Api.ProjectManagement;

public sealed partial class MySqlProjectManagementReader(ProjectManagementOptions options) : IProjectManagementReader
{
    public async Task<IReadOnlyList<ProjectManagementProject>> GetProjectsAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            return await ReadProjectsAsync(connection, cancellationToken);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementProjectSummary>> GetProjectSummariesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            await using var command = new MySqlCommand("""
                SELECT p.id, p.id_project, p.pm, p.customer, p.project_code, p.annex_no, p.annex_name,
                       p.status, p.amount, p.contract_type, p.percent_budget, p.budget, p.start_date, p.end_date,
                       p.sign_date, p.acceptance_date, p.warranty_months, p.warranty_end_date,
                       p.maintenance_percent, p.next_action_date, p.remarks, p.comm_percent, p.comm_amount, p.active_baseline,
                       COALESCE(t.task_count, 0) AS task_count,
                       COALESCE(t.completed_task_count, 0) AS completed_task_count,
                       COALESCE(t.active_task_count, 0) AS active_task_count,
                       COALESCE(t.overdue_task_count, 0) AS overdue_task_count,
                       COALESCE(dep.dependency_count, 0) AS dependency_count,
                       COALESCE(t.average_progress, 0) AS average_progress,
                       COALESCE(pl.plan_count, 0) AS plan_count,
                       COALESCE(s.plan_percent, 0) AS latest_plan_percent,
                       COALESCE(s.actual_percent, 0) AS latest_actual_percent,
                       s.year AS latest_summary_year,
                       s.week AS latest_summary_week,
                       s.notes AS latest_summary_notes
                FROM pm_project p
                LEFT JOIN (
                    SELECT t.id_project,
                           COUNT(*) AS task_count,
                           SUM(CASE WHEN t.status = 3 OR t.progress >= 100 THEN 1 ELSE 0 END) AS completed_task_count,
                           SUM(CASE WHEN t.status NOT IN (3, 9) AND t.progress < 100 THEN 1 ELSE 0 END) AS active_task_count,
                           SUM(CASE WHEN t.status NOT IN (3, 9) AND t.progress < 100
                                     AND t.end_date IS NOT NULL AND t.end_date < CURRENT_DATE() THEN 1 ELSE 0 END) AS overdue_task_count,
                           ROUND(AVG(t.progress), 1) AS average_progress
                    FROM pm_project_task t
                    WHERE t.status <> 9
                    GROUP BY t.id_project
                ) t ON t.id_project = p.id
                LEFT JOIN (
                    SELECT t.id_project, COUNT(DISTINCT d.id) AS dependency_count
                    FROM pm_task_dependency d
                    INNER JOIN pm_project_task t ON t.id = d.task_id
                    WHERE t.status <> 9
                    GROUP BY t.id_project
                ) dep ON dep.id_project = p.id
                LEFT JOIN (
                    SELECT id_project, COUNT(*) AS plan_count
                    FROM pm_task_plan
                    WHERE status <> 9
                    GROUP BY id_project
                ) pl ON pl.id_project = p.id
                LEFT JOIN pm_project_summary s ON s.id = (
                    SELECT s2.id
                    FROM pm_project_summary s2
                    WHERE s2.id_project = p.id AND s2.status <> 9
                    ORDER BY COALESCE(s2.year, 0) DESC, COALESCE(s2.week, 0) DESC, s2.id DESC
                    LIMIT 1
                )
                WHERE p.is_tracking <> 0 AND p.status <> 9
                ORDER BY p.id
                """, connection);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<ProjectManagementProjectSummary>();
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new ProjectManagementProjectSummary(
                    ReadProject(reader),
                    ReadInt32(reader, "task_count"),
                    ReadInt32(reader, "completed_task_count"),
                    ReadInt32(reader, "active_task_count"),
                    ReadInt32(reader, "overdue_task_count"),
                    ReadInt32(reader, "dependency_count"),
                    ReadInt32(reader, "plan_count"),
                    reader.GetDecimal("average_progress"),
                    reader.GetDecimal("latest_plan_percent"),
                    reader.GetDecimal("latest_actual_percent"),
                    GetNullableInt(reader, "latest_summary_year"),
                    GetNullableInt(reader, "latest_summary_week"),
                    GetNullableString(reader, "latest_summary_notes")));
            }
            return result;
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<ProjectManagementSummaryPage> GetSummaryPageAsync(ProjectManagementSummaryQuery query, CancellationToken cancellationToken)
    {
        var normalized = query with
        {
            Limit = Math.Clamp(query.Limit, 1, 200),
            Offset = Math.Max(0, query.Offset)
        };

        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            var filters = BuildSummaryFilters(normalized);
            var total = await CountSummariesAsync(connection, filters, cancellationToken);
            var rows = await ReadSummaryPageAsync(connection, filters, normalized, cancellationToken);
            return new ProjectManagementSummaryPage(rows, total, normalized.Limit, normalized.Offset);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<ProjectManagementSummaryListItem?> GetSummaryAsync(long summaryId, CancellationToken cancellationToken)
    {
        ValidateSummaryId(summaryId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            return await ReadSummaryByIdAsync(connection, summaryId, cancellationToken);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<string>> GetSummaryCustomersAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            await using var command = new MySqlCommand("""
                SELECT DISTINCT customer
                FROM pm_project
                WHERE customer IS NOT NULL AND customer <> '' AND status <> 9
                ORDER BY customer
                """, connection);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<string>();
            while (await reader.ReadAsync(cancellationToken))
                result.Add(reader.GetString("customer"));
            return result;
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementSummaryProject>> GetSummaryProjectsAsync(string? customer, CancellationToken cancellationToken)
    {
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            await using var command = new MySqlCommand("""
                SELECT id, id_project, annex_no, annex_name, customer, pm, status, project_code
                FROM pm_project
                WHERE status <> 9 AND is_tracking <> 0
                """ + (string.IsNullOrWhiteSpace(customer) ? "" : " AND customer = @customer") + """
                ORDER BY id DESC
                """, connection);
            if (!string.IsNullOrWhiteSpace(customer)) command.Parameters.AddWithValue("@customer", customer.Trim());
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<ProjectManagementSummaryProject>();
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new ProjectManagementSummaryProject(
                    reader.GetInt32("id"),
                    GetNullableInt(reader, "id_project"),
                    GetNullableString(reader, "annex_no"),
                    GetNullableString(reader, "annex_name"),
                    GetNullableString(reader, "customer"),
                    GetNullableString(reader, "pm"),
                    reader.GetInt32("status"),
                    GetNullableString(reader, "project_code")));
            }
            return result;
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementTask>> GetTasksAsync(int projectId, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            return await ReadTasksAsync(connection, projectId, cancellationToken);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<ProjectManagementGantt> GetGanttAsync(int projectId, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            var project = await ReadProjectAsync(connection, projectId, cancellationToken)
                ?? throw new ProjectManagementStoreException("Project was not found in the project-management store.", "PROJECT_MANAGEMENT_PROJECT_NOT_FOUND", StatusCodes.Status404NotFound);
            var tasks = await ReadTasksAsync(connection, projectId, cancellationToken);
            var assignees = await ReadAssigneesAsync(connection, projectId, cancellationToken);
            var dependencies = await ReadDependenciesAsync(connection, projectId, cancellationToken);
            var assigneesByTask = assignees.GroupBy(item => item.TaskId).ToDictionary(group => group.Key, group => (IReadOnlyList<string>)group.Select(item => item.Assignee).ToList());
            var ganttTasks = tasks.Select(task => new ProjectManagementGanttTask(
                task.Id,
                task.ParentId,
                task.TaskCode,
                task.TaskName,
                task.StartDate,
                task.EndDate,
                task.ActualStartDate,
                task.ActualEndDate,
                task.Duration,
                task.Progress,
                task.Priority,
                task.TaskType,
                task.Status,
                task.SortOrder,
                assigneesByTask.GetValueOrDefault(task.Id, []))).ToList();
            return new ProjectManagementGantt(project, ganttTasks, dependencies);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<ProjectManagementCriticalPath> GetCriticalPathAsync(int projectId, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            var tasks = await ReadTasksAsync(connection, projectId, cancellationToken);
            var dependencies = await ReadDependenciesAsync(connection, projectId, cancellationToken);
            return CriticalPathCalculator.Calculate(tasks, dependencies);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementBaseline>> GetBaselinesAsync(int projectId, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            return await ReadBaselinesAsync(connection, projectId, cancellationToken);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<ProjectManagementBaselineComparison> GetBaselineComparisonAsync(int projectId, string baselineName, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        ValidateBaselineName(baselineName);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            return await ReadBaselineComparisonAsync(connection, projectId, baselineName, cancellationToken);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementTaskComment>> GetTaskCommentsAsync(int taskId, CancellationToken cancellationToken)
    {
        ValidateTaskId(taskId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            return await ReadTaskCommentsAsync(connection, taskId, cancellationToken);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementTaskComment>> GetCommentRepliesAsync(int commentId, CancellationToken cancellationToken)
    {
        if (commentId <= 0)
            throw new ProjectManagementStoreException("Comment id is invalid.", "PROJECT_MANAGEMENT_COMMENT_ID_INVALID", StatusCodes.Status400BadRequest);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            return await ReadCommentRepliesAsync(connection, commentId, cancellationToken);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementTaskAttachment>> GetTaskAttachmentsAsync(int taskId, CancellationToken cancellationToken)
    {
        ValidateTaskId(taskId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            return await ReadTaskAttachmentsAsync(connection, taskId, cancellationToken);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<ProjectManagementActivityPage> GetProjectActivityAsync(int projectId, int? taskId, int limit, int offset, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        if (taskId is <= 0)
            throw new ProjectManagementStoreException("Task id is invalid.", "PROJECT_MANAGEMENT_TASK_ID_INVALID", StatusCodes.Status400BadRequest);
        var normalizedLimit = Math.Clamp(limit, 1, 200);
        var normalizedOffset = Math.Max(0, offset);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            return await ReadProjectActivityAsync(connection, projectId, taskId, normalizedLimit, normalizedOffset, cancellationToken);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementTaskActivity>> GetTaskActivityAsync(int taskId, int limit, CancellationToken cancellationToken)
    {
        ValidateTaskId(taskId);
        var normalizedLimit = Math.Clamp(limit, 1, 200);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            return await ReadTaskActivityAsync(connection, taskId, normalizedLimit, cancellationToken);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<ProjectManagementWorkload> GetWorkloadAsync(int? projectId, string? startDate, string? endDate, CancellationToken cancellationToken)
    {
        var start = ParseWorkloadDate(startDate) ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var end = ParseWorkloadDate(endDate) ?? new DateTime(start.Year, start.Month, DateTime.DaysInMonth(start.Year, start.Month));
        if (end < start)
            throw new ProjectManagementStoreException("Workload end date must be on or after start date.", "PROJECT_MANAGEMENT_WORKLOAD_DATE_RANGE_INVALID", StatusCodes.Status400BadRequest);

        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            await using var command = new MySqlCommand($"""
                SELECT a.assignee, t.id, t.task_code, t.task_name, t.start_date, t.end_date,
                       t.progress, t.status, t.priority, t.id_project, p.annex_no AS project_name
                FROM pm_task_assignee a
                INNER JOIN pm_project_task t ON t.id = a.task_id
                LEFT JOIN pm_project p ON p.id_project = t.id_project
                WHERE t.status <> 9
                  AND ((t.start_date <= @endDate AND t.end_date >= @startDate)
                       OR (t.start_date BETWEEN @startDate AND @endDate)
                       OR (t.end_date BETWEEN @startDate AND @endDate))
                  {(projectId.HasValue ? "AND t.id_project = @projectId" : string.Empty)}
                ORDER BY a.assignee, t.start_date, t.id
                """, connection);
            command.Parameters.AddWithValue("@startDate", start.Date);
            command.Parameters.AddWithValue("@endDate", end.Date);
            if (projectId.HasValue) command.Parameters.AddWithValue("@projectId", projectId.Value);

            var rows = new List<(string Assignee, ProjectManagementWorkloadTask Task)>();
            await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    rows.Add((reader.GetString("assignee"), new ProjectManagementWorkloadTask(
                        reader.GetInt32("id"), reader.GetString("task_code"), reader.GetString("task_name"),
                        GetNullableDate(reader, "start_date"), GetNullableDate(reader, "end_date"),
                        reader.GetDecimal("progress"), reader.GetInt32("status"), reader.GetInt32("priority"),
                        reader.GetInt32("id_project"), GetNullableString(reader, "project_name"))));
                }
            }

            var workingDays = CountWeekdays(start, end);
            var resources = rows.GroupBy(row => row.Assignee, StringComparer.OrdinalIgnoreCase)
                .Select(group =>
                {
                    var tasks = group.Select(row => row.Task).ToList();
                    var active = tasks.Count(task => task.Status is 0 or 1);
                    return new ProjectManagementWorkloadResource(
                        group.Key, tasks.Count, tasks.Count(task => task.Status == 3),
                        tasks.Count(task => (task.Status is 0 or 1 or 2) && task.EndDate is not null && DateTime.Parse(task.EndDate) < DateTime.UtcNow.Date),
                        active, tasks.Count == 0 ? 0 : tasks.Average(task => task.Progress),
                        workingDays == 0 ? 0 : (int)Math.Round(active / (decimal)workingDays * 100), tasks);
                }).ToList();
            return new ProjectManagementWorkload(start.ToString("yyyy-MM-dd"), end.ToString("yyyy-MM-dd"), workingDays, resources);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementPayment>> GetProjectPaymentsAsync(int projectId, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            await using var command = new MySqlCommand("""
                SELECT p.id, p.pj_id, p.payment_no, p.process_date, p.invoice_date,
                       p.payment_percent, p.payment_amount, p.status,
                       p.actual_payment_date, p.remarks,
                       (SELECT COUNT(*) FROM pm_project_payment_doc d WHERE d.payment_id = p.id) AS document_count
                FROM pm_project_payment p
                WHERE p.pj_id = @projectId AND p.status <> 9
                ORDER BY p.payment_no ASC
                """, connection);
            command.Parameters.AddWithValue("@projectId", projectId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<ProjectManagementPayment>();
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new ProjectManagementPayment(
                    reader.GetInt64("id"), reader.GetInt64("pj_id"), reader.GetInt32("payment_no"),
                    GetDate(reader, "process_date"), GetDate(reader, "invoice_date"),
                    reader.GetDecimal("payment_percent"), reader.GetDecimal("payment_amount"),
                    reader.GetInt32("status"), GetDate(reader, "actual_payment_date"),
                    GetNullableString(reader, "remarks"), reader.GetInt32("document_count")));
            }
            return result;
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementCostOther>> GetProjectCostsOtherAsync(int projectId, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            await using var command = new MySqlCommand("""
                SELECT id, id_project, cost_type, phase, amount, executor_notes,
                       product_type, status, remarks, updated_at
                FROM pm_project_cost_other
                WHERE id_project = @projectId AND status <> 9
                ORDER BY updated_at DESC, id DESC
                """, connection);
            command.Parameters.AddWithValue("@projectId", projectId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<ProjectManagementCostOther>();
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new ProjectManagementCostOther(
                    reader.GetInt64("id"), reader.GetInt32("id_project"), reader.GetString("cost_type"),
                    reader.GetString("phase"), reader.GetDecimal("amount"),
                    GetNullableString(reader, "executor_notes"), GetNullableString(reader, "product_type"),
                    reader.GetInt32("status"), GetNullableString(reader, "remarks"), GetDateTime(reader, "updated_at")));
            }
            return result;
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementPdca>> GetProjectPdcaAsync(int projectId, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            await using var command = new MySqlCommand("""
                SELECT id, id_project, report_date, reporter, issue_title, description,
                       solution, process_status, process_date, fault_members, notes, updated_at
                FROM pm_project_pdca
                WHERE id_project = @projectId AND process_status <> 9
                ORDER BY report_date DESC, created_at DESC, id DESC
                """, connection);
            command.Parameters.AddWithValue("@projectId", projectId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<ProjectManagementPdca>();
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new ProjectManagementPdca(
                    reader.GetInt64("id"), GetNullableInt(reader, "id_project"), GetDate(reader, "report_date") ?? "",
                    reader.GetString("reporter"), reader.GetString("issue_title"), GetNullableString(reader, "description"),
                    GetNullableString(reader, "solution"), reader.GetInt32("process_status"), GetDate(reader, "process_date"),
                    GetNullableString(reader, "fault_members"), GetNullableString(reader, "notes"), GetDateTime(reader, "updated_at")));
            }
            return result;
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementRequest>> GetProjectRequestsAsync(int projectId, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            await using var command = new MySqlCommand("""
                SELECT id, project_id, request_date, member, manager, request_type,
                       title, content, amount, reference, processed_date, status,
                       approver, notes, updated_at
                FROM pm_project_request
                WHERE project_id = @projectId
                ORDER BY request_date DESC, created_at DESC, id DESC
                """, connection);
            command.Parameters.AddWithValue("@projectId", projectId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<ProjectManagementRequest>();
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new ProjectManagementRequest(
                    reader.GetInt64("id"), GetNullableInt(reader, "project_id"), GetDate(reader, "request_date") ?? "",
                    reader.GetString("member"), GetNullableString(reader, "manager"), reader.GetString("request_type"),
                    reader.GetString("title"), reader.GetString("content"), GetNullableDecimal(reader, "amount"),
                    GetNullableString(reader, "reference"), GetDate(reader, "processed_date"), reader.GetInt32("status"),
                    GetNullableString(reader, "approver"), GetNullableString(reader, "notes"), GetDateTime(reader, "updated_at")));
            }
            return result;
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementCommission>> GetProjectCommissionsAsync(int projectId, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            await using var command = new MySqlCommand("""
                SELECT c.id, c.project_id, c.payment_id, p.payment_no,
                       c.commission_percent, c.commission_amount, c.status,
                       c.remarks, c.expected_date, c.recipient_info, c.actual_date
                FROM pm_project_commission c
                INNER JOIN pm_project_payment p ON p.id = c.payment_id
                WHERE c.project_id = @projectId AND c.status <> 9
                ORDER BY p.payment_no ASC, c.id ASC
                """, connection);
            command.Parameters.AddWithValue("@projectId", projectId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<ProjectManagementCommission>();
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new ProjectManagementCommission(
                    reader.GetInt64("id"), reader.GetInt32("project_id"), reader.GetInt64("payment_id"),
                    reader.GetInt32("payment_no"), reader.GetDecimal("commission_percent"),
                    reader.GetDecimal("commission_amount"), reader.GetInt32("status"),
                    GetNullableString(reader, "remarks"), GetDate(reader, "expected_date"),
                    GetNullableString(reader, "recipient_info"), GetDate(reader, "actual_date")));
            }
            return result;
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<IReadOnlyList<ProjectManagementPaymentDocument>> GetPaymentDocumentsAsync(long paymentId, CancellationToken cancellationToken)
    {
        if (paymentId <= 0)
            throw new ProjectManagementStoreException("Payment id is invalid.", "PROJECT_MANAGEMENT_PAYMENT_ID_INVALID", StatusCodes.Status400BadRequest);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            await using var command = new MySqlCommand("""
                SELECT id, payment_id, doc_name, doc_status, attachment, remarks, updated_at
                FROM pm_project_payment_doc
                WHERE payment_id = @paymentId
                ORDER BY id ASC
                """, connection);
            command.Parameters.AddWithValue("@paymentId", paymentId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<ProjectManagementPaymentDocument>();
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new ProjectManagementPaymentDocument(
                    reader.GetInt64("id"), reader.GetInt64("payment_id"), reader.GetString("doc_name"),
                    reader.GetInt32("doc_status"), GetNullableString(reader, "attachment"),
                    GetNullableString(reader, "remarks"), GetDateTime(reader, "updated_at")));
            }
            return result;
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<ProjectManagementPlanPage> GetPlanPageAsync(ProjectManagementPlanQuery query, CancellationToken cancellationToken)
    {
        var normalized = query with
        {
            Limit = Math.Clamp(query.Limit, 1, 200),
            Offset = Math.Max(0, query.Offset)
        };

        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            var filters = BuildPlanFilters(normalized);
            var total = await CountPlansAsync(connection, filters, cancellationToken);
            var rows = await ReadPlanPageAsync(connection, filters, normalized, cancellationToken);
            return new ProjectManagementPlanPage(rows, total, normalized.Limit, normalized.Offset);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    public async Task<ProjectManagementWorkspace> GetWorkspaceAsync(int projectId, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            var project = await ReadProjectAsync(connection, projectId, cancellationToken)
                ?? throw new ProjectManagementStoreException("Project was not found in the project-management store.", "PROJECT_MANAGEMENT_PROJECT_NOT_FOUND", StatusCodes.Status404NotFound);
            var tasks = await ReadTasksAsync(connection, projectId, cancellationToken);
            var assignees = await ReadAssigneesAsync(connection, projectId, cancellationToken);
            var dependencies = await ReadDependenciesAsync(connection, projectId, cancellationToken);
            var logs = await ReadTaskLogsAsync(connection, projectId, cancellationToken);
            var plans = await ReadPlansAsync(connection, projectId, cancellationToken);
            var summaries = await ReadSummariesAsync(connection, projectId, cancellationToken);

            var assigneesByTask = assignees.GroupBy(item => item.TaskId).ToDictionary(group => group.Key, group => (IReadOnlyList<ProjectManagementTaskAssignee>)group.ToList());
            var dependenciesByTask = dependencies.GroupBy(item => item.TaskId).ToDictionary(group => group.Key, group => (IReadOnlyList<ProjectManagementTaskDependency>)group.ToList());
            var logsByTask = logs.GroupBy(item => item.TaskId).ToDictionary(group => group.Key, group => (IReadOnlyList<ProjectManagementTaskLog>)group.ToList());
            var taskDetails = tasks.Select(task => new ProjectManagementTaskDetails(
                task,
                assigneesByTask.GetValueOrDefault(task.Id, []),
                dependenciesByTask.GetValueOrDefault(task.Id, []),
                logsByTask.GetValueOrDefault(task.Id, []))).ToList();

            return new ProjectManagementWorkspace(project, taskDetails, plans, summaries);
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw QueryFailed();
        }
    }

    private static async Task<IReadOnlyList<ProjectManagementProject>> ReadProjectsAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, id_project, pm, customer, project_code, annex_no, annex_name,
                   status, amount, contract_type, percent_budget, budget, start_date, end_date,
                   sign_date, acceptance_date, warranty_months, warranty_end_date,
                   maintenance_percent, next_action_date, remarks, comm_percent, comm_amount, active_baseline
            FROM pm_project
            WHERE is_tracking <> 0 AND status <> 9
            ORDER BY id
            """, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementProject>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(ReadProject(reader));
        return result;
    }

    private static async Task<ProjectManagementProject?> ReadProjectAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, id_project, pm, customer, project_code, annex_no, annex_name,
                   status, amount, contract_type, percent_budget, budget, start_date, end_date,
                   sign_date, acceptance_date, warranty_months, warranty_end_date,
                   maintenance_percent, next_action_date, remarks, comm_percent, comm_amount, active_baseline
            FROM pm_project
            WHERE id = @projectId AND is_tracking <> 0 AND status <> 9
            LIMIT 1
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadProject(reader) : null;
    }

    private static async Task<IReadOnlyList<ProjectManagementTask>> ReadTasksAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, id_project, parent_id, task_code, task_name, description,
                   product, start_date, end_date, actual_start, actual_end,
                   duration, progress, plan, priority, task_type, status,
                   sort_order, effort, is_critical, phase, dept_role,
                   created_by, source_system, source_collection, source_project_id,
                   source_id, source_revision, source_url
            FROM pm_project_task
            WHERE id_project = @projectId AND status <> 9
            ORDER BY sort_order, id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementTask>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(ReadTask(reader));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementBaseline>> ReadBaselinesAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT baseline_name, created_by, MIN(created_at) AS created_at, COUNT(*) AS task_count
            FROM pm_task_baseline
            WHERE id_project = @projectId
            GROUP BY baseline_name, created_by
            ORDER BY MIN(created_at) DESC
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementBaseline>();
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new ProjectManagementBaseline(
                reader.GetString("baseline_name"),
                reader.GetString("created_by"),
                GetDateTime(reader, "created_at"),
                ReadInt32(reader, "task_count")));
        }
        return result;
    }

    private static async Task<ProjectManagementBaselineComparison> ReadBaselineComparisonAsync(MySqlConnection connection, int projectId, string baselineName, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT t.id, t.task_code, t.task_name,
                   t.start_date AS actual_start, t.end_date AS actual_end,
                   t.duration AS actual_duration, t.progress, t.status,
                   b.planned_start_date, b.planned_end_date, b.planned_duration,
                   DATEDIFF(t.start_date, b.planned_start_date) AS start_variance,
                   DATEDIFF(t.end_date, b.planned_end_date) AS end_variance,
                   (t.duration - b.planned_duration) AS duration_variance
            FROM pm_project_task t
            LEFT JOIN pm_task_baseline b ON b.task_id = t.id AND b.baseline_name = @baselineName
            WHERE t.id_project = @projectId AND t.status <> 9
            ORDER BY t.sort_order, t.id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        command.Parameters.AddWithValue("@baselineName", baselineName);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var tasks = new List<ProjectManagementBaselineTask>();
        while (await reader.ReadAsync(cancellationToken))
        {
            tasks.Add(new ProjectManagementBaselineTask(
                reader.GetInt32("id"),
                reader.GetString("task_code"),
                reader.GetString("task_name"),
                GetDate(reader, "actual_start"),
                GetDate(reader, "actual_end"),
                reader.GetInt32("actual_duration"),
                reader.GetDecimal("progress"),
                reader.GetInt32("status"),
                GetDate(reader, "planned_start_date"),
                GetDate(reader, "planned_end_date"),
                GetNullableInt(reader, "planned_duration"),
                GetNullableInt(reader, "start_variance"),
                GetNullableInt(reader, "end_variance"),
                GetNullableInt(reader, "duration_variance")));
        }

        var tasksAhead = tasks.Count(task => task.EndVariance < 0);
        var tasksOnTime = tasks.Count(task => task.EndVariance == 0);
        var tasksBehind = tasks.Count(task => task.EndVariance > 0);
        var totalStartVariance = tasks.Where(task => task.StartVariance.HasValue).Sum(task => task.StartVariance!.Value);
        var totalEndVariance = tasks.Where(task => task.EndVariance.HasValue).Sum(task => task.EndVariance!.Value);
        var denominator = tasks.Count;
        var averageStartVariance = denominator == 0 ? 0m : Math.Round((decimal)totalStartVariance / denominator, 1);
        var averageEndVariance = denominator == 0 ? 0m : Math.Round((decimal)totalEndVariance / denominator, 1);
        return new ProjectManagementBaselineComparison(
            baselineName,
            tasks,
            new ProjectManagementBaselineSummary(tasks.Count, tasksAhead, tasksOnTime, tasksBehind, averageStartVariance, averageEndVariance));
    }

    private static async Task<IReadOnlyList<ProjectManagementTaskComment>> ReadTaskCommentsAsync(MySqlConnection connection, int taskId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT c.id, c.task_id, c.user_login, c.comment, c.parent_id,
                   c.created_at, c.updated_at,
                   (SELECT COUNT(*) FROM pm_task_comment r WHERE r.parent_id = c.id) AS reply_count
            FROM pm_task_comment c
            WHERE c.task_id = @taskId AND c.parent_id IS NULL
            ORDER BY c.created_at DESC
            """, connection);
        command.Parameters.AddWithValue("@taskId", taskId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementTaskComment>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(ReadComment(reader));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementTaskComment>> ReadCommentRepliesAsync(MySqlConnection connection, int commentId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT c.id, c.task_id, c.user_login, c.comment, c.parent_id,
                   c.created_at, c.updated_at, 0 AS reply_count
            FROM pm_task_comment c
            WHERE c.parent_id = @commentId
            ORDER BY c.created_at ASC
            """, connection);
        command.Parameters.AddWithValue("@commentId", commentId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementTaskComment>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(ReadComment(reader));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementTaskAttachment>> ReadTaskAttachmentsAsync(MySqlConnection connection, int taskId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, task_id, user_login, file_name, file_path, file_size, file_type, created_at
            FROM pm_task_attachment
            WHERE task_id = @taskId
            ORDER BY created_at DESC
            """, connection);
        command.Parameters.AddWithValue("@taskId", taskId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementTaskAttachment>();
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new ProjectManagementTaskAttachment(
                reader.GetInt32("id"),
                reader.GetInt32("task_id"),
                reader.GetString("user_login"),
                reader.GetString("file_name"),
                reader.GetString("file_path"),
                GetNullableInt(reader, "file_size"),
                GetNullableString(reader, "file_type"),
                GetDateTime(reader, "created_at")));
        }
        return result;
    }

    private static async Task<ProjectManagementActivityPage> ReadProjectActivityAsync(MySqlConnection connection, int projectId, int? taskId, int limit, int offset, CancellationToken cancellationToken)
    {
        var taskFilter = taskId.HasValue ? " AND a.task_id = @taskId" : string.Empty;
        await using var command = new MySqlCommand($"""
            SELECT a.id, a.id_project, a.task_id, a.user_login, a.action_type,
                   a.field_name, a.old_value, a.new_value, a.description, a.created_at,
                   t.task_code, t.task_name
            FROM pm_task_activity_log a
            LEFT JOIN pm_project_task t ON t.id = a.task_id
            WHERE a.id_project = @projectId{taskFilter}
            ORDER BY a.created_at DESC
            LIMIT @limit OFFSET @offset
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        if (taskId.HasValue) command.Parameters.AddWithValue("@taskId", taskId.Value);
        command.Parameters.AddWithValue("@limit", limit);
        command.Parameters.AddWithValue("@offset", offset);
        var activities = new List<ProjectManagementTaskActivity>();
        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
                activities.Add(ReadActivity(reader));
        }

        await using var countCommand = new MySqlCommand($"SELECT COUNT(*) FROM pm_task_activity_log WHERE id_project = @projectId{(taskId.HasValue ? " AND task_id = @taskId" : string.Empty)}", connection);
        countCommand.Parameters.AddWithValue("@projectId", projectId);
        if (taskId.HasValue) countCommand.Parameters.AddWithValue("@taskId", taskId.Value);
        var total = Convert.ToInt32(await countCommand.ExecuteScalarAsync(cancellationToken));
        return new ProjectManagementActivityPage(activities, total, limit, offset);
    }

    private static async Task<IReadOnlyList<ProjectManagementTaskActivity>> ReadTaskActivityAsync(MySqlConnection connection, int taskId, int limit, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT a.id, a.id_project, a.task_id, a.user_login, a.action_type,
                   a.field_name, a.old_value, a.new_value, a.description, a.created_at,
                   NULL AS task_code, NULL AS task_name
            FROM pm_task_activity_log a
            WHERE a.task_id = @taskId
            ORDER BY a.created_at DESC
            LIMIT @limit
            """, connection);
        command.Parameters.AddWithValue("@taskId", taskId);
        command.Parameters.AddWithValue("@limit", limit);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementTaskActivity>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(ReadActivity(reader));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementTaskAssignee>> ReadAssigneesAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT a.id, a.task_id, a.assignee, a.role
            FROM pm_task_assignee a
            INNER JOIN pm_project_task t ON t.id = a.task_id
            WHERE t.id_project = @projectId AND t.status <> 9
            ORDER BY a.task_id, a.role, a.id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementTaskAssignee>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementTaskAssignee(reader.GetInt32("id"), reader.GetInt32("task_id"), reader.GetString("assignee"), reader.GetInt32("role")));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementTaskDependency>> ReadDependenciesAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT d.id, d.task_id, d.depends_on_id, d.dependency_type, d.lag_days
            FROM pm_task_dependency d
            INNER JOIN pm_project_task t ON t.id = d.task_id
            WHERE t.id_project = @projectId AND t.status <> 9
            ORDER BY d.task_id, d.id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementTaskDependency>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementTaskDependency(reader.GetInt32("id"), reader.GetInt32("task_id"), reader.GetInt32("depends_on_id"), reader.GetInt32("dependency_type"), reader.GetInt32("lag_days")));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementTaskLog>> ReadTaskLogsAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT l.id, l.task_id, l.updated_by, l.field_name, l.old_value,
                   l.new_value, l.note, l.created_at
            FROM pm_task_log l
            INNER JOIN pm_project_task t ON t.id = l.task_id
            WHERE t.id_project = @projectId AND t.status <> 9
            ORDER BY l.created_at DESC, l.id DESC
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementTaskLog>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementTaskLog(
                reader.GetInt32("id"),
                reader.GetInt32("task_id"),
                reader.GetString("updated_by"),
                reader.GetString("field_name"),
                GetNullableString(reader, "old_value"),
                GetNullableString(reader, "new_value"),
                GetNullableString(reader, "note"),
                GetDateTime(reader, "created_at")));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementPlan>> ReadPlansAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, year, month, week, section_type, entry_type, customer,
                   id_project, task_desc, from_date, to_date, current_progress,
                   plan_progress, result_progress, result_notes, resource,
                   remarks, sort_order, source_plan_id, created_by, created_at, status
            FROM pm_task_plan
            WHERE id_project = @projectId AND status <> 9
            ORDER BY year DESC, week DESC, sort_order, id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementPlan>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementPlan(
                reader.GetInt32("id"),
                reader.GetInt32("year"),
                reader.GetInt32("month"),
                reader.GetInt32("week"),
                reader.GetInt32("section_type"),
                reader.GetInt32("entry_type"),
                GetNullableString(reader, "customer"),
                GetNullableInt(reader, "id_project"),
                reader.GetString("task_desc"),
                GetDate(reader, "from_date"),
                GetDate(reader, "to_date"),
                reader.GetDecimal("current_progress"),
                reader.GetDecimal("plan_progress"),
                GetNullableDecimal(reader, "result_progress"),
                GetNullableString(reader, "result_notes"),
                GetNullableString(reader, "resource"),
                GetNullableString(reader, "remarks"),
                reader.GetInt32("sort_order"),
                GetNullableInt(reader, "source_plan_id"),
                GetNullableString(reader, "created_by"),
                GetDateTime(reader, "created_at"),
                reader.GetInt32("status")));
        return result;
    }

    private static List<(string Name, object Value)> BuildPlanFilters(ProjectManagementPlanQuery query)
    {
        var filters = new List<(string Name, object Value)>();
        if (query.Year.HasValue) filters.Add(("@year", query.Year.Value));
        if (query.Week.HasValue) filters.Add(("@week", query.Week.Value));
        if (query.ProjectId.HasValue) filters.Add(("@projectId", query.ProjectId.Value));
        if (!string.IsNullOrWhiteSpace(query.Customer)) filters.Add(("@customer", query.Customer.Trim()));
        if (!string.IsNullOrWhiteSpace(query.ProjectManager)) filters.Add(("@projectManager", query.ProjectManager.Trim()));
        if (query.SectionType.HasValue) filters.Add(("@sectionType", query.SectionType.Value));
        if (query.Status.HasValue) filters.Add(("@status", query.Status.Value));
        return filters;
    }

    private static List<(string Name, object Value)> BuildSummaryFilters(ProjectManagementSummaryQuery query)
    {
        var filters = new List<(string Name, object Value)>();
        if (query.Year.HasValue) filters.Add(("@year", query.Year.Value));
        if (query.Week.HasValue) filters.Add(("@week", query.Week.Value));
        if (query.ProjectId.HasValue) filters.Add(("@projectId", query.ProjectId.Value));
        if (!string.IsNullOrWhiteSpace(query.Customer)) filters.Add(("@customer", query.Customer.Trim()));
        if (!string.IsNullOrWhiteSpace(query.ProjectManager)) filters.Add(("@projectManager", query.ProjectManager.Trim()));
        if (query.SectionType.HasValue) filters.Add(("@sectionType", query.SectionType.Value));
        if (query.Status.HasValue) filters.Add(("@status", query.Status.Value));
        return filters;
    }

    private static string BuildSummaryWhere(List<(string Name, object Value)> filters)
    {
        var clauses = new List<string> { "s.status <> 9" };
        var has = (string name) => filters.Any(item => item.Name == name);
        if (has("@year")) clauses.Add("s.year = @year");
        if (has("@week")) clauses.Add("s.week = @week");
        if (has("@projectId")) clauses.Add("(s.id_project = @projectId OR s.pj_id = @projectId)");
        if (has("@customer")) clauses.Add("s.customer = @customer");
        if (has("@projectManager")) clauses.Add("(s.created_by = @projectManager OR s.pm = @projectManager OR pp.pm = @projectManager OR pp2.pm = @projectManager)");
        if (has("@sectionType")) clauses.Add("s.section_type = @sectionType");
        if (has("@status")) clauses.Add("s.status = @status");
        return "WHERE " + string.Join(" AND ", clauses);
    }

    private static async Task<int> CountSummariesAsync(MySqlConnection connection, List<(string Name, object Value)> filters, CancellationToken cancellationToken)
    {
        var where = BuildSummaryWhere(filters);
        await using var command = new MySqlCommand($"""
            SELECT COUNT(*)
            FROM pm_project_summary s
            LEFT JOIN pm_project pp ON pp.id = s.id_project
            LEFT JOIN pm_project pp2 ON pp2.id = s.pj_id AND pp.id IS NULL
            {where}
            """, connection);
        foreach (var (name, value) in filters) command.Parameters.AddWithValue(name, value);
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
    }

    private static async Task<IReadOnlyList<ProjectManagementSummaryListItem>> ReadSummaryPageAsync(MySqlConnection connection, List<(string Name, object Value)> filters, ProjectManagementSummaryQuery query, CancellationToken cancellationToken)
    {
        var where = BuildSummaryWhere(filters);
        await using var command = new MySqlCommand($"""
            SELECT s.id, s.pm, s.year, s.customer, s.id_project, s.annex_name,
                   s.plan_percent, s.actual_percent, s.week, s.section_type,
                   s.entry_type, s.start_date, s.end_date, s.notes, s.resources,
                   s.updated_by, s.status,
                   COALESCE(pp.id, pp2.id) AS project_record_id,
                   COALESCE(pp.project_code, pp2.project_code) AS project_code,
                   COALESCE(pp.annex_no, pp2.annex_no) AS annex_no,
                   COALESCE(pp.annex_name, pp2.annex_name) AS project_annex_name,
                   COALESCE(pp.contract_type, pp2.contract_type) AS contract_type,
                   COALESCE(pp.status, pp2.status) AS project_status,
                   COALESCE(pp.pm, pp2.pm) AS project_manager
            FROM pm_project_summary s
            LEFT JOIN pm_project pp ON pp.id = s.id_project
            LEFT JOIN pm_project pp2 ON pp2.id = s.pj_id AND pp.id IS NULL
            {where}
            ORDER BY s.year DESC, s.week DESC, s.section_type ASC, s.customer ASC, s.id DESC
            LIMIT @limit OFFSET @offset
            """, connection);
        foreach (var (name, value) in filters) command.Parameters.AddWithValue(name, value);
        command.Parameters.AddWithValue("@limit", query.Limit);
        command.Parameters.AddWithValue("@offset", query.Offset);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementSummaryListItem>();
        while (await reader.ReadAsync(cancellationToken)) result.Add(ReadSummaryListItem(reader));
        return result;
    }

    private static async Task<ProjectManagementSummaryListItem?> ReadSummaryByIdAsync(MySqlConnection connection, long summaryId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT s.id, s.pm, s.year, s.customer, s.id_project, s.annex_name,
                   s.plan_percent, s.actual_percent, s.week, s.section_type,
                   s.entry_type, s.start_date, s.end_date, s.notes, s.resources,
                   s.updated_by, s.status,
                   COALESCE(pp.id, pp2.id) AS project_record_id,
                   COALESCE(pp.project_code, pp2.project_code) AS project_code,
                   COALESCE(pp.annex_no, pp2.annex_no) AS annex_no,
                   COALESCE(pp.annex_name, pp2.annex_name) AS project_annex_name,
                   COALESCE(pp.contract_type, pp2.contract_type) AS contract_type,
                   COALESCE(pp.status, pp2.status) AS project_status,
                   COALESCE(pp.pm, pp2.pm) AS project_manager
            FROM pm_project_summary s
            LEFT JOIN pm_project pp ON pp.id = s.id_project
            LEFT JOIN pm_project pp2 ON pp2.id = s.pj_id AND pp.id IS NULL
            WHERE s.id = @summaryId AND s.status <> 9
            """, connection);
        command.Parameters.AddWithValue("@summaryId", summaryId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadSummaryListItem(reader) : null;
    }

    private static ProjectManagementSummaryListItem ReadSummaryListItem(MySqlDataReader reader) => new(
        new ProjectManagementSummary(
            reader.GetInt64("id"),
            GetNullableString(reader, "pm"),
            GetNullableInt(reader, "year"),
            GetNullableString(reader, "customer"),
            reader.GetInt32("id_project"),
            GetNullableString(reader, "annex_name"),
            reader.GetDecimal("plan_percent"),
            reader.GetDecimal("actual_percent"),
            GetNullableInt(reader, "week"),
            reader.GetInt32("section_type"),
            reader.GetInt32("entry_type"),
            GetDate(reader, "start_date"),
            GetDate(reader, "end_date"),
            GetNullableString(reader, "notes"),
            GetNullableString(reader, "resources"),
            GetNullableString(reader, "updated_by"),
            reader.GetInt32("status")),
        GetNullableInt(reader, "project_record_id"),
        GetNullableString(reader, "project_code"),
        GetNullableString(reader, "annex_no"),
        GetNullableString(reader, "project_annex_name"),
        GetNullableInt(reader, "contract_type"),
        GetNullableInt(reader, "project_status"),
        GetNullableString(reader, "project_manager"));

    private static string BuildPlanWhere(List<(string Name, object Value)> filters)
    {
        var clauses = new List<string>();
        var has = (string name) => filters.Any(item => item.Name == name);
        if (has("@status")) clauses.Add("tp.status = @status");
        else clauses.Add("tp.status <> 9");
        if (has("@year")) clauses.Add("tp.year = @year");
        if (has("@week")) clauses.Add("tp.week = @week");
        if (has("@projectId")) clauses.Add("tp.id_project = @projectId");
        if (has("@customer")) clauses.Add("tp.customer = @customer");
        if (has("@projectManager")) clauses.Add("(pp.pm = @projectManager OR tp.created_by = @projectManager)");
        if (has("@sectionType")) clauses.Add("tp.section_type = @sectionType");
        return "WHERE " + string.Join(" AND ", clauses);
    }

    private static async Task<int> CountPlansAsync(MySqlConnection connection, List<(string Name, object Value)> filters, CancellationToken cancellationToken)
    {
        var where = BuildPlanWhere(filters);
        await using var command = new MySqlCommand($"SELECT COUNT(*) FROM pm_task_plan tp LEFT JOIN pm_project pp ON pp.id = tp.id_project {where}", connection);
        foreach (var (name, value) in filters) command.Parameters.AddWithValue(name, value);
        var scalar = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt32(scalar);
    }

    private static async Task<IReadOnlyList<ProjectManagementPlanListItem>> ReadPlanPageAsync(MySqlConnection connection, List<(string Name, object Value)> filters, ProjectManagementPlanQuery query, CancellationToken cancellationToken)
    {
        var where = BuildPlanWhere(filters);
        var orderBy = BuildPlanOrderBy(query);
        await using var command = new MySqlCommand($"""
            SELECT tp.id, tp.year, tp.month, tp.week, tp.section_type, tp.entry_type, tp.customer,
                   tp.id_project, tp.task_desc, tp.from_date, tp.to_date, tp.current_progress,
                   tp.plan_progress, tp.result_progress, tp.result_notes, tp.resource,
                   tp.remarks, tp.sort_order, tp.source_plan_id, tp.created_by, tp.created_at, tp.status,
                   pp.id AS project_record_id, pp.project_code, pp.annex_no, pp.annex_name, pp.pm AS project_manager
            FROM pm_task_plan tp
            LEFT JOIN pm_project pp ON pp.id = tp.id_project
            {where}
            {orderBy}
            LIMIT @limit OFFSET @offset
            """, connection);
        foreach (var (name, value) in filters) command.Parameters.AddWithValue(name, value);
        command.Parameters.AddWithValue("@limit", query.Limit);
        command.Parameters.AddWithValue("@offset", query.Offset);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementPlanListItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new ProjectManagementPlanListItem(
                ReadPlan(reader),
                GetNullableInt(reader, "project_record_id"),
                GetNullableString(reader, "project_code"),
                GetNullableString(reader, "annex_no"),
                GetNullableString(reader, "annex_name"),
                GetNullableString(reader, "project_manager")));
        }
        return result;
    }

    private static string BuildPlanOrderBy(ProjectManagementPlanQuery query)
    {
        var expression = query.Sort.Trim().ToLowerInvariant() switch
        {
            "year" => "tp.year",
            "week" => "tp.week",
            "section_type" => "tp.section_type",
            "customer" => "tp.customer",
            "annex_no" => "COALESCE(pp.annex_no, tp.customer)",
            "from_date" => "tp.from_date",
            "plan_percent" => "tp.plan_progress",
            "actual_percent" => "tp.current_progress",
            "task_desc" => "tp.task_desc",
            "result_notes" => "tp.result_notes",
            "resource" => "tp.resource",
            "created_by" => "tp.created_by",
            "status" => "tp.status",
            "created_at" => "tp.created_at",
            _ => "tp.id",
        };
        var direction = string.Equals(query.Order, "asc", StringComparison.OrdinalIgnoreCase) ? "ASC" : "DESC";
        return $"ORDER BY {expression} {direction}, tp.id DESC";
    }

    private static ProjectManagementPlan ReadPlan(MySqlDataReader reader) => new(
        reader.GetInt32("id"),
        reader.GetInt32("year"),
        reader.GetInt32("month"),
        reader.GetInt32("week"),
        reader.GetInt32("section_type"),
        reader.GetInt32("entry_type"),
        GetNullableString(reader, "customer"),
        GetNullableInt(reader, "id_project"),
        reader.GetString("task_desc"),
        GetDate(reader, "from_date"),
        GetDate(reader, "to_date"),
        reader.GetDecimal("current_progress"),
        reader.GetDecimal("plan_progress"),
        GetNullableDecimal(reader, "result_progress"),
        GetNullableString(reader, "result_notes"),
        GetNullableString(reader, "resource"),
        GetNullableString(reader, "remarks"),
        reader.GetInt32("sort_order"),
        GetNullableInt(reader, "source_plan_id"),
        GetNullableString(reader, "created_by"),
        GetDateTime(reader, "created_at"),
        reader.GetInt32("status"));

    private static async Task<IReadOnlyList<ProjectManagementSummary>> ReadSummariesAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, pm, year, customer, id_project, annex_name, plan_percent,
                   actual_percent, week, section_type, entry_type, start_date,
                   end_date, notes, resources, updated_by, status
            FROM pm_project_summary
            WHERE id_project = @projectId AND status <> 9
            ORDER BY year DESC, week DESC, section_type, id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementSummary>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementSummary(
                reader.GetInt64("id"),
                GetNullableString(reader, "pm"),
                GetNullableInt(reader, "year"),
                GetNullableString(reader, "customer"),
                reader.GetInt32("id_project"),
                GetNullableString(reader, "annex_name"),
                reader.GetDecimal("plan_percent"),
                reader.GetDecimal("actual_percent"),
                GetNullableInt(reader, "week"),
                reader.GetInt32("section_type"),
                reader.GetInt32("entry_type"),
                GetDate(reader, "start_date"),
                GetDate(reader, "end_date"),
                GetNullableString(reader, "notes"),
                GetNullableString(reader, "resources"),
                GetNullableString(reader, "updated_by"),
                reader.GetInt32("status")));
        return result;
    }

    private async Task<MySqlConnection> OpenAsync(CancellationToken cancellationToken)
    {
        if (!options.Enabled)
            throw new ProjectManagementStoreException("Project-management store is disabled.", "PROJECT_MANAGEMENT_STORE_DISABLED", StatusCodes.Status503ServiceUnavailable);
        if (string.IsNullOrWhiteSpace(options.ConnectionString))
            throw new ProjectManagementStoreException("Project-management store is not configured.", "PROJECT_MANAGEMENT_STORE_NOT_CONFIGURED", StatusCodes.Status503ServiceUnavailable);

        var connection = new MySqlConnection(options.ConnectionString);
        try
        {
            await connection.OpenAsync(cancellationToken);
            return connection;
        }
        catch (MySqlException)
        {
            await connection.DisposeAsync();
            throw new ProjectManagementStoreException("Project-management data is temporarily unavailable.", "PROJECT_MANAGEMENT_STORE_UNAVAILABLE", StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static ProjectManagementProject ReadProject(MySqlDataReader reader) => new(
        reader.GetInt32("id"),
        GetNullableInt(reader, "id_project"),
        reader.GetString("pm"),
        reader.GetString("customer"),
        GetNullableString(reader, "project_code"),
        GetNullableString(reader, "annex_no"),
        GetNullableString(reader, "annex_name"),
        reader.GetInt32("status"),
        reader.GetDecimal("amount"),
        reader.GetInt32("contract_type"),
        reader.GetDecimal("percent_budget"),
        reader.GetDecimal("budget"),
        GetDate(reader, "start_date"),
        GetDate(reader, "end_date"),
        GetDate(reader, "sign_date"),
        GetDate(reader, "acceptance_date"),
        GetNullableInt(reader, "warranty_months"),
        GetDate(reader, "warranty_end_date"),
        GetNullableDecimal(reader, "maintenance_percent"),
        GetDate(reader, "next_action_date"),
        GetNullableString(reader, "remarks"),
        GetNullableDecimal(reader, "comm_percent"),
        GetNullableDecimal(reader, "comm_amount"),
        GetNullableString(reader, "active_baseline"));

    private static int ReadInt32(MySqlDataReader reader, string name) => Convert.ToInt32(reader.GetValue(reader.GetOrdinal(name)));

    private static ProjectManagementTask ReadTask(MySqlDataReader reader) => new(
        reader.GetInt32("id"),
        reader.GetInt32("id_project"),
        GetNullableInt(reader, "parent_id"),
        reader.GetString("task_code"),
        reader.GetString("task_name"),
        GetNullableString(reader, "description"),
        GetNullableString(reader, "product"),
        GetDate(reader, "start_date"),
        GetDate(reader, "end_date"),
        reader.GetDecimal("progress"),
        reader.GetDecimal("plan"),
        reader.GetInt32("priority"),
        reader.GetInt32("task_type"),
        reader.GetInt32("status"),
        reader.GetInt32("sort_order"),
        GetNullableString(reader, "created_by"),
        GetNullableString(reader, "source_system"),
        GetNullableString(reader, "source_collection"),
        GetNullableString(reader, "source_project_id"),
        GetNullableString(reader, "source_id"),
        GetNullableInt(reader, "source_revision"),
        GetDate(reader, "actual_start"),
        GetDate(reader, "actual_end"),
        reader.GetInt32("duration"),
        GetNullableDecimal(reader, "effort"),
        reader.GetBoolean("is_critical"),
        GetNullableString(reader, "phase"),
        GetNullableString(reader, "dept_role"),
        GetNullableString(reader, "source_url"));

    private static ProjectManagementTaskComment ReadComment(MySqlDataReader reader) => new(
        reader.GetInt32("id"),
        reader.GetInt32("task_id"),
        reader.GetString("user_login"),
        reader.GetString("comment"),
        GetNullableInt(reader, "parent_id"),
        GetDateTime(reader, "created_at"),
        GetDateTime(reader, "updated_at"),
        ReadInt32(reader, "reply_count"));

    private static ProjectManagementTaskActivity ReadActivity(MySqlDataReader reader) => new(
        reader.GetInt32("id"),
        reader.GetInt32("id_project"),
        GetNullableInt(reader, "task_id"),
        reader.GetString("user_login"),
        reader.GetString("action_type"),
        GetNullableString(reader, "field_name"),
        GetNullableString(reader, "old_value"),
        GetNullableString(reader, "new_value"),
        GetNullableString(reader, "description"),
        GetDateTime(reader, "created_at"),
        GetNullableString(reader, "task_code"),
        GetNullableString(reader, "task_name"));

    private static DateTime? ParseWorkloadDate(string? value)
        => DateTime.TryParse(value, out var parsed) ? parsed.Date : null;

    private static int CountWeekdays(DateTime start, DateTime end)
    {
        var count = 0;
        for (var date = start.Date; date <= end.Date; date = date.AddDays(1))
            if (date.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday) count++;
        return count;
    }

    private static void ValidateProjectId(int projectId)
    {
        if (projectId <= 0)
            throw new ProjectManagementStoreException("Project id is invalid.", "PROJECT_MANAGEMENT_PROJECT_ID_INVALID", StatusCodes.Status400BadRequest);
    }

    private static void ValidateTaskId(int taskId)
    {
        if (taskId <= 0)
            throw new ProjectManagementStoreException("Task id is invalid.", "PROJECT_MANAGEMENT_TASK_ID_INVALID", StatusCodes.Status400BadRequest);
    }

    private static void ValidateBaselineName(string baselineName)
    {
        if (string.IsNullOrWhiteSpace(baselineName))
            throw new ProjectManagementStoreException("Baseline name is required.", "PROJECT_MANAGEMENT_BASELINE_NAME_REQUIRED", StatusCodes.Status400BadRequest);
    }

    private static void ValidateSummaryId(long summaryId)
    {
        if (summaryId <= 0)
            throw new ProjectManagementStoreException("Summary id is invalid.", "PROJECT_MANAGEMENT_SUMMARY_ID_INVALID", StatusCodes.Status400BadRequest);
    }

    private static ProjectManagementStoreException QueryFailed() => new("Project-management data could not be read.", "PROJECT_MANAGEMENT_QUERY_FAILED", StatusCodes.Status503ServiceUnavailable);
    private static string? GetNullableString(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetString(name);
    private static int? GetNullableInt(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetInt32(name);
    private static decimal? GetNullableDecimal(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetDecimal(name);
    private static string? GetDate(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetDateTime(name).ToString("yyyy-MM-dd");
    private static string? GetNullableDate(MySqlDataReader reader, string name) => GetDate(reader, name);
    private static string? GetDateTime(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetDateTime(name).ToString("yyyy-MM-dd HH:mm:ss");
}
