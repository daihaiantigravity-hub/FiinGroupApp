using Microsoft.Extensions.Diagnostics.HealthChecks;
using MySqlConnector;

namespace FiinGroupApp.Api.ProjectManagement;

public sealed class ProjectManagementHealthCheck(ProjectManagementOptions options) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        if (!options.Enabled)
            return HealthCheckResult.Healthy("Project-management store is disabled.");
        if (string.IsNullOrWhiteSpace(options.ConnectionString))
            return HealthCheckResult.Unhealthy("Project-management store is enabled without a connection string.");

        try
        {
            await using var connection = new MySqlConnection(options.ConnectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new MySqlCommand("SELECT 1", connection);
            await command.ExecuteScalarAsync(cancellationToken);
            return HealthCheckResult.Healthy("Project-management store is reachable.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("Project-management store is unavailable.", exception);
        }
    }
}
