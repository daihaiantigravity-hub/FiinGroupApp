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
                   status, amount, budget, start_date, end_date
            FROM pm_project
            WHERE is_tracking <> 0
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
                   status, amount, budget, start_date, end_date
            FROM pm_project
            WHERE id = @projectId AND is_tracking <> 0
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
                   remarks, sort_order, created_by, status
            FROM pm_task_plan
            WHERE id_project = @projectId
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
                GetNullableString(reader, "created_by"),
                reader.GetInt32("status")));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementSummary>> ReadSummariesAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, pm, year, customer, id_project, annex_name, plan_percent,
                   actual_percent, week, section_type, entry_type, start_date,
                   end_date, notes, resources, updated_by, status
            FROM pm_project_summary
            WHERE id_project = @projectId
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
        reader.GetDecimal("budget"),
        GetDate(reader, "start_date"),
        GetDate(reader, "end_date"));

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

    private static void ValidateProjectId(int projectId)
    {
        if (projectId <= 0)
            throw new ProjectManagementStoreException("Project id is invalid.", "PROJECT_MANAGEMENT_PROJECT_ID_INVALID", StatusCodes.Status400BadRequest);
    }

    private static ProjectManagementStoreException QueryFailed() => new("Project-management data could not be read.", "PROJECT_MANAGEMENT_QUERY_FAILED", StatusCodes.Status503ServiceUnavailable);
    private static string? GetNullableString(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetString(name);
    private static int? GetNullableInt(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetInt32(name);
    private static decimal? GetNullableDecimal(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetDecimal(name);
    private static string? GetDate(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetDateTime(name).ToString("yyyy-MM-dd");
    private static string? GetDateTime(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetDateTime(name).ToString("yyyy-MM-dd HH:mm:ss");
}
