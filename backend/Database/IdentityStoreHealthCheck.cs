using Microsoft.Extensions.Diagnostics.HealthChecks;
using MySqlConnector;

namespace FiinGroupApp.Api.Database;

public sealed class IdentityStoreHealthCheck(string? connectionString, bool enabled) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        if (!enabled) return HealthCheckResult.Healthy("Identity store is disabled; legacy compatibility mode is active.");
        if (string.IsNullOrWhiteSpace(connectionString)) return HealthCheckResult.Unhealthy("Identity store is enabled without a connection string.");

        try
        {
            await using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new MySqlCommand("SELECT 1 FROM app_users LIMIT 1", connection);
            await command.ExecuteScalarAsync(cancellationToken);
            return HealthCheckResult.Healthy("Identity store is reachable.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("Identity store is unavailable.", exception);
        }
    }
}
