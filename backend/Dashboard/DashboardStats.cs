using MySqlConnector;

namespace FiinGroupApp.Api.Dashboard;

public sealed class DashboardOptions
{
    public bool LegacyStatsEnabled { get; init; }
    public string? ConnectionString { get; init; }
}

public sealed record DashboardStats(
    DashboardEmployeeStats Employees,
    DashboardProjectStats Projects,
    DashboardRevenueStats Revenue,
    DashboardPendingStats Pending);

public sealed record DashboardEmployeeStats(long Total, long NewThisMonth);
public sealed record DashboardProjectStats(long Active, long Total, long New);
public sealed record DashboardRevenueStats(decimal Total, string Display, string YtdLabel);
public sealed record DashboardPendingStats(long Count);

public interface IDashboardStatsReader
{
    Task<DashboardStats> ReadAsync(CancellationToken cancellationToken);
}

public sealed class MySqlDashboardStatsReader(DashboardOptions options) : IDashboardStatsReader
{
    private const int CutoffYear = 2026;
    private const int CutoffMonth = 5;

    public async Task<DashboardStats> ReadAsync(CancellationToken cancellationToken)
    {
        if (!options.LegacyStatsEnabled || string.IsNullOrWhiteSpace(options.ConnectionString))
            throw new DashboardStatsException("Legacy dashboard stats are disabled or not configured.", "DASHBOARD_DATASTORE_NOT_CONFIGURED", StatusCodes.Status503ServiceUnavailable);

        await using var connection = new MySqlConnection(options.ConnectionString);
        try
        {
            await connection.OpenAsync(cancellationToken);
            var today = DateTime.Today;
            var employee = await ReadPairAsync(connection, """
                SELECT COUNT(*), COUNT(CASE WHEN MONTH(created_on) = MONTH(CURRENT_DATE) AND YEAR(created_on) = YEAR(CURRENT_DATE) THEN 1 END)
                FROM hr_employees WHERE status IN (1, 2)
                """, cancellationToken);
            var projects = await ReadTripleAsync(connection, """
                SELECT
                    COUNT(CASE WHEN status = 1 AND contract_type = 1 THEN 1 END),
                    COUNT(CASE WHEN status != 9 THEN 1 END),
                    COUNT(CASE WHEN status = 1 AND contract_type = 1 AND MONTH(created_at) = MONTH(CURRENT_DATE) AND YEAR(created_at) = YEAR(CURRENT_DATE) THEN 1 END)
                FROM pm_project
                """, cancellationToken);
            var oldRevenue = await ReadOldRevenueAsync(connection, today, cancellationToken);
            var newRevenue = await ReadNewRevenueAsync(connection, today, cancellationToken);
            var pending = await ReadScalarAsync(connection, "SELECT COUNT(*) FROM hr_staff_evaluation WHERE status IN ('pending', 'in-progress')", cancellationToken);
            var revenue = oldRevenue + newRevenue;
            return new DashboardStats(
                new DashboardEmployeeStats(employee.First, employee.Second),
                new DashboardProjectStats(projects.First, projects.Second, projects.Third),
                new DashboardRevenueStats(revenue, FormatRevenue(revenue), $"T01-T{today.Month:00}/{today.Year}"),
                new DashboardPendingStats(pending));
        }
        catch (DashboardStatsException) { throw; }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new DashboardStatsException("Legacy dashboard database timed out.", "DASHBOARD_DATASTORE_TIMEOUT", StatusCodes.Status503ServiceUnavailable);
        }
        catch (MySqlException)
        {
            throw new DashboardStatsException("Legacy dashboard data is temporarily unavailable.", "DASHBOARD_DATASTORE_UNAVAILABLE", StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static async Task<(long First, long Second)> ReadPairAsync(MySqlConnection connection, string sql, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return (0, 0);
        return (ToLong(reader.GetValue(0)), ToLong(reader.GetValue(1)));
    }

    private static async Task<(long First, long Second, long Third)> ReadTripleAsync(MySqlConnection connection, string sql, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return (0, 0, 0);
        return (ToLong(reader.GetValue(0)), ToLong(reader.GetValue(1)), ToLong(reader.GetValue(2)));
    }

    private static async Task<long> ReadScalarAsync(MySqlConnection connection, string sql, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(sql, connection);
        return ToLong(await command.ExecuteScalarAsync(cancellationToken));
    }

    private static async Task<decimal> ReadOldRevenueAsync(MySqlConnection connection, DateTime today, CancellationToken cancellationToken)
    {
        var maxMonth = today.Year < CutoffYear ? today.Month : today.Year == CutoffYear ? Math.Min(today.Month, CutoffMonth - 1) : 0;
        if (maxMonth < 1) return 0;
        await using var command = new MySqlCommand("""
            SELECT COALESCE(SUM(pay.payment_amount), 0)
            FROM pm_project_payment pay JOIN pm_project p ON pay.pj_id = p.id
            WHERE p.status != 9 AND pay.status IN (2, 3)
              AND COALESCE(pay.invoice_date, pay.actual_payment_date, pay.process_date) IS NOT NULL
              AND YEAR(COALESCE(pay.invoice_date, pay.actual_payment_date, pay.process_date)) = @year
              AND MONTH(COALESCE(pay.invoice_date, pay.actual_payment_date, pay.process_date)) <= @month
            """, connection);
        command.Parameters.AddWithValue("@year", today.Year);
        command.Parameters.AddWithValue("@month", maxMonth);
        return ToDecimal(await command.ExecuteScalarAsync(cancellationToken));
    }

    private static async Task<decimal> ReadNewRevenueAsync(MySqlConnection connection, DateTime today, CancellationToken cancellationToken)
    {
        if (today.Year < CutoffYear || today.Year == CutoffYear && today.Month < CutoffMonth) return 0;
        var startMonth = today.Year > CutoffYear ? 1 : CutoffMonth;
        await using var command = new MySqlCommand("""
            SELECT COALESCE(SUM(CAST(fn_decrypt(t.amount) AS DECIMAL(18,2))), 0)
            FROM mt_account_transaction t JOIN mt_account a ON t.account_id = a.id
            WHERE t.effect_type = 2 AND t.status = 1 AND a.account_type = 3
              AND t.transaction_type = 'invoice_issued'
              AND YEAR(COALESCE(t.effect_date, t.transaction_date)) = @year
              AND MONTH(COALESCE(t.effect_date, t.transaction_date)) >= @startMonth
              AND MONTH(COALESCE(t.effect_date, t.transaction_date)) <= @endMonth
            """, connection);
        command.Parameters.AddWithValue("@year", today.Year);
        command.Parameters.AddWithValue("@startMonth", startMonth);
        command.Parameters.AddWithValue("@endMonth", today.Month);
        return ToDecimal(await command.ExecuteScalarAsync(cancellationToken));
    }

    private static long ToLong(object? value) => value is null || value is DBNull ? 0 : Convert.ToInt64(value);
    private static decimal ToDecimal(object? value) => value is null || value is DBNull ? 0 : Convert.ToDecimal(value);

    private static string FormatRevenue(decimal value)
    {
        var absolute = Math.Abs(value);
        if (absolute >= 1_000_000_000) return $"{value / 1_000_000_000:0.00}B";
        if (absolute >= 1_000_000) return $"{Math.Round(value / 1_000_000):0}M";
        if (absolute >= 1_000) return $"{Math.Round(value / 1_000):0}K";
        return value.ToString("N0", System.Globalization.CultureInfo.GetCultureInfo("vi-VN"));
    }
}

public sealed class DashboardStatsException(string message, string code, int statusCode) : Exception(message)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
}
