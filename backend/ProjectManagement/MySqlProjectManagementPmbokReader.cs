using MySqlConnector;

namespace FiinGroupApp.Api.ProjectManagement;

public sealed partial class MySqlProjectManagementReader
{
    public async Task<ProjectManagementPmbokWorkspace> GetPmbokWorkspaceAsync(int projectId, CancellationToken cancellationToken)
    {
        ValidateProjectId(projectId);
        if (!options.PmbokEnabled)
            throw new ProjectManagementStoreException("PMBOK target tables are disabled.", "PROJECT_MANAGEMENT_PMBOK_DISABLED", StatusCodes.Status503ServiceUnavailable);

        try
        {
            await using var connection = await OpenAsync(cancellationToken);
            _ = await ReadProjectAsync(connection, projectId, cancellationToken)
                ?? throw new ProjectManagementStoreException("Project was not found in the project-management store.", "PROJECT_MANAGEMENT_PROJECT_NOT_FOUND", StatusCodes.Status404NotFound);

            return new ProjectManagementPmbokWorkspace(
                await ReadCharterAsync(connection, projectId, cancellationToken),
                await ReadStakeholdersAsync(connection, projectId, cancellationToken),
                await ReadResourcesAsync(connection, projectId, cancellationToken),
                await ReadRaciAsync(connection, projectId, cancellationToken),
                await ReadRisksAsync(connection, projectId, cancellationToken),
                await ReadCostPlansAsync(connection, projectId, cancellationToken),
                await ReadQualityPlansAsync(connection, projectId, cancellationToken),
                await ReadDefinitionOfDoneAsync(connection, projectId, cancellationToken),
                await ReadCommunicationPlansAsync(connection, projectId, cancellationToken),
                await ReadChangeLogsAsync(connection, projectId, cancellationToken));
        }
        catch (ProjectManagementStoreException)
        {
            throw;
        }
        catch (MySqlException)
        {
            throw new ProjectManagementStoreException("PMBOK target tables are unavailable. Apply migration 004 before enabling this feature.", "PROJECT_MANAGEMENT_PMBOK_SCHEMA_UNAVAILABLE", StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static async Task<ProjectManagementCharter?> ReadCharterAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, pj_id, business_case, objectives, in_scope, out_scope,
                   deliverables, assumptions, constraints_txt AS constraints_text,
                   high_risks, sponsor, product_owner, approval_status, approved_by,
                   approved_at, status
            FROM pm_project_charter
            WHERE pj_id = @projectId AND status <> 9
            LIMIT 1
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        return new ProjectManagementCharter(
            reader.GetInt64("id"), reader.GetInt64("pj_id"),
            GetNullableString(reader, "business_case"), GetNullableString(reader, "objectives"),
            GetNullableString(reader, "in_scope"), GetNullableString(reader, "out_scope"),
            GetNullableString(reader, "deliverables"), GetNullableString(reader, "assumptions"),
            GetNullableString(reader, "constraints_text"), GetNullableString(reader, "high_risks"),
            GetNullableString(reader, "sponsor"), GetNullableString(reader, "product_owner"),
            reader.GetInt32("approval_status"), GetNullableString(reader, "approved_by"),
            GetDateTime(reader, "approved_at"), reader.GetInt32("status"));
    }

    private static async Task<IReadOnlyList<ProjectManagementStakeholder>> ReadStakeholdersAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, pj_id, stakeholder_type, member, partner_cd, name, role,
                   power, interest, expectation, engagement_strategy, owner, status
            FROM pm_project_stakeholder
            WHERE pj_id = @projectId AND status <> 9
            ORDER BY id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementStakeholder>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementStakeholder(
                reader.GetInt64("id"), reader.GetInt64("pj_id"), reader.GetString("stakeholder_type"),
                GetNullableString(reader, "member"), GetNullableString(reader, "partner_cd"),
                GetNullableString(reader, "name"), GetNullableString(reader, "role"),
                GetNullableString(reader, "power"), GetNullableString(reader, "interest"),
                GetNullableString(reader, "expectation"), GetNullableString(reader, "engagement_strategy"),
                GetNullableString(reader, "owner"), reader.GetInt32("status")));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementResource>> ReadResourcesAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, pj_id, member, role, sub_team, effort, unit_rate,
                   planned_mandays, status
            FROM pm_project_resource
            WHERE pj_id = @projectId AND status <> 9
            ORDER BY id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementResource>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementResource(
                reader.GetInt64("id"), reader.GetInt64("pj_id"),
                GetNullableString(reader, "member"), GetNullableString(reader, "role"),
                GetNullableString(reader, "sub_team"), GetNullableDecimal(reader, "effort"),
                GetNullableDecimal(reader, "unit_rate"), GetNullableDecimal(reader, "planned_mandays"),
                reader.GetInt32("status")));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementRaci>> ReadRaciAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, pj_id, activity, role, raci_value, sort_order, status
            FROM pm_project_raci
            WHERE pj_id = @projectId AND status <> 9
            ORDER BY sort_order, id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementRaci>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementRaci(
                reader.GetInt64("id"), reader.GetInt64("pj_id"), reader.GetString("activity"),
                reader.GetString("role"), GetNullableString(reader, "raci_value"),
                reader.GetInt32("sort_order"), reader.GetInt32("status")));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementRisk>> ReadRisksAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, pj_id, risk_code, description, category, probability,
                   impact, score, response, owner, trigger_desc, review_date, status
            FROM pm_project_risk
            WHERE pj_id = @projectId AND status <> 9
            ORDER BY score DESC, id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementRisk>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementRisk(
                reader.GetInt64("id"), reader.GetInt64("pj_id"),
                GetNullableString(reader, "risk_code"), GetNullableString(reader, "description"),
                GetNullableString(reader, "category"), GetNullableInt(reader, "probability"),
                GetNullableInt(reader, "impact"), reader.GetInt32("score"),
                GetNullableString(reader, "response"), GetNullableString(reader, "owner"),
                GetNullableString(reader, "trigger_desc"), GetDate(reader, "review_date"),
                reader.GetInt32("status")));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementCostPlan>> ReadCostPlansAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, pj_id, item_name, description, amount, is_contingency,
                   contingency_percent, sort_order, status
            FROM pm_cost_plan
            WHERE pj_id = @projectId AND status <> 9
            ORDER BY is_contingency, sort_order, id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementCostPlan>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementCostPlan(
                reader.GetInt64("id"), reader.GetInt64("pj_id"),
                GetNullableString(reader, "item_name"), GetNullableString(reader, "description"),
                GetNullableDecimal(reader, "amount"), reader.GetBoolean("is_contingency"),
                GetNullableDecimal(reader, "contingency_percent"), reader.GetInt32("sort_order"),
                reader.GetInt32("status")));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementQualityPlan>> ReadQualityPlansAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, pj_id, criteria, applies_to, verify_method,
                   acceptance_standard, owner, sort_order, status
            FROM pm_quality_plan
            WHERE pj_id = @projectId AND status <> 9
            ORDER BY sort_order, id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementQualityPlan>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementQualityPlan(
                reader.GetInt64("id"), reader.GetInt64("pj_id"),
                GetNullableString(reader, "criteria"), GetNullableString(reader, "applies_to"),
                GetNullableString(reader, "verify_method"), GetNullableString(reader, "acceptance_standard"),
                GetNullableString(reader, "owner"), reader.GetInt32("sort_order"), reader.GetInt32("status")));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementDefinitionOfDone>> ReadDefinitionOfDoneAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, pj_id, item_text, sort_order, status
            FROM pm_quality_dod
            WHERE pj_id = @projectId AND status <> 9
            ORDER BY sort_order, id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementDefinitionOfDone>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementDefinitionOfDone(
                reader.GetInt64("id"), reader.GetInt64("pj_id"), reader.GetString("item_text"),
                reader.GetInt32("sort_order"), reader.GetInt32("status")));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementCommunicationPlan>> ReadCommunicationPlansAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, pj_id, activity, purpose, audience, frequency, channel,
                   owner, sort_order, status
            FROM pm_communication_plan
            WHERE pj_id = @projectId AND status <> 9
            ORDER BY sort_order, id
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementCommunicationPlan>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementCommunicationPlan(
                reader.GetInt64("id"), reader.GetInt64("pj_id"),
                GetNullableString(reader, "activity"), GetNullableString(reader, "purpose"),
                GetNullableString(reader, "audience"), GetNullableString(reader, "frequency"),
                GetNullableString(reader, "channel"), GetNullableString(reader, "owner"),
                reader.GetInt32("sort_order"), reader.GetInt32("status")));
        return result;
    }

    private static async Task<IReadOnlyList<ProjectManagementChangeLog>> ReadChangeLogsAsync(MySqlConnection connection, int projectId, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand("""
            SELECT id, pj_id, cr_code, change_date, change_desc, requested_by,
                   reason, impact_scope, impact_time, impact_cost, est_mandays,
                   decision, approver, status
            FROM pm_change_log
            WHERE pj_id = @projectId AND status <> 9
            ORDER BY change_date DESC, id DESC
            """, connection);
        command.Parameters.AddWithValue("@projectId", projectId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<ProjectManagementChangeLog>();
        while (await reader.ReadAsync(cancellationToken))
            result.Add(new ProjectManagementChangeLog(
                reader.GetInt64("id"), reader.GetInt64("pj_id"),
                GetNullableString(reader, "cr_code"), GetDate(reader, "change_date"),
                GetNullableString(reader, "change_desc"), GetNullableString(reader, "requested_by"),
                GetNullableString(reader, "reason"), GetNullableString(reader, "impact_scope"),
                GetNullableString(reader, "impact_time"), GetNullableString(reader, "impact_cost"),
                GetNullableDecimal(reader, "est_mandays"), reader.GetInt32("decision"),
                GetNullableString(reader, "approver"), reader.GetInt32("status")));
        return result;
    }
}
