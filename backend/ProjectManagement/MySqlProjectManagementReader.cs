using MySqlConnector;

namespace FiinGroupApp.Api.ProjectManagement;

public sealed class MySqlProjectManagementReader(ProjectManagementOptions options) : IProjectManagementReader
{
    public async Task<IReadOnlyList<ProjectManagementProject>> GetProjectsAsync(CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
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
        {
            result.Add(new ProjectManagementProject(
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
                GetDate(reader, "end_date")));
        }
        return result;
    }

    public async Task<IReadOnlyList<ProjectManagementTask>> GetTasksAsync(int projectId, CancellationToken cancellationToken)
    {
        if (projectId <= 0)
            throw new ProjectManagementStoreException("Project id is invalid.", "PROJECT_MANAGEMENT_PROJECT_ID_INVALID", StatusCodes.Status400BadRequest);

        await using var connection = await OpenAsync(cancellationToken);
        await using var command = new MySqlCommand("""
            SELECT id, id_project, parent_id, task_code, task_name, description,
                   product, start_date, end_date, progress, plan, priority,
                   task_type, status, sort_order, created_by, source_system,
                   source_collection, source_project_id, source_id, source_revision
            FROM pm_project_task
            WHERE id_project = @projectId AND status <> 9
            ORDER BY sort_order, id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementTask>();
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new ProjectManagementTask(
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
                GetNullableInt(reader, "source_revision")));
        }
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
        catch (MySqlException exception)
        {
            await connection.DisposeAsync();
            throw new ProjectManagementStoreException("Project-management data is temporarily unavailable.", "PROJECT_MANAGEMENT_STORE_UNAVAILABLE", StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static string? GetNullableString(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetString(name);
    private static int? GetNullableInt(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetInt32(name);
    private static string? GetDate(MySqlDataReader reader, string name) => reader.IsDBNull(reader.GetOrdinal(name)) ? null : reader.GetDateTime(name).ToString("yyyy-MM-dd");
}
