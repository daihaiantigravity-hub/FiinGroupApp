using MySqlConnector;

namespace FiinGroupApp.Api.Auth;

public sealed class MySqlUserStore(string connectionString, IPasswordHasher passwordHasher, ILogger<MySqlUserStore> logger) : IUserStore, ITfsIdentityResolver
{
    public async Task<AuthenticatedUser?> ResolveAsync(TfsIdentity identity, CancellationToken cancellationToken)
    {
        try
        {
            var candidates = new[]
            {
                identity.IdentityId,
                identity.UniqueName,
                identity.Domain is null ? identity.Username : $"{identity.Domain}\\{identity.Username}"
            }.Where(value => !string.IsNullOrWhiteSpace(value)).Distinct(StringComparer.OrdinalIgnoreCase);

            foreach (var subject in candidates)
            {
                var user = await FindExternalUserAsync(subject, cancellationToken);
                if (user is not null) return new AuthenticatedUser(user, await GetPermissionsAsync(user, cancellationToken));
            }
            return null;
        }
        catch (MySqlException exception)
        {
            logger.LogError(exception, "Identity store query failed for TFS identity {IdentityId} and provider subject lookup.", identity.IdentityId);
            var (code, message) = exception.Number switch
            {
                1045 => ("TFS_IDENTITY_STORE_ACCESS_DENIED", "Identity store rejected the configured database credentials."),
                1049 => ("TFS_IDENTITY_STORE_DATABASE_NOT_FOUND", "Identity store database was not found."),
                1146 => ("TFS_IDENTITY_STORE_SCHEMA_MISSING", "Identity store schema is missing a required table."),
                _ => ("TFS_IDENTITY_STORE_UNAVAILABLE", "TFS identity store is temporarily unavailable.")
            };
            throw new TfsIdentityMappingException(message, code, StatusCodes.Status503ServiceUnavailable);
        }
    }

    public async Task<UserProfile?> FindByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand("SELECT id, username, display_name, email FROM app_users WHERE username = @username AND status = 'ACTIVE' AND (locked_until IS NULL OR locked_until < UTC_TIMESTAMP(6)) LIMIT 1", connection);
        command.Parameters.AddWithValue("@username", username);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        return new UserProfile(reader.GetGuid("id"), reader.GetString("username"), reader.GetString("display_name"), reader.IsDBNull(reader.GetOrdinal("email")) ? null : reader.GetString("email"), []);
    }

    public async Task<bool> VerifyPasswordAsync(UserProfile user, string password, CancellationToken cancellationToken)
    {
        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand("SELECT password_hash FROM app_users WHERE id = @id AND status = 'ACTIVE' LIMIT 1", connection);
        command.Parameters.AddWithValue("@id", user.Id);
        var value = await command.ExecuteScalarAsync(cancellationToken);
        return value is string encodedHash && passwordHasher.Verify(password, encodedHash);
    }

    public async Task<PermissionSet> GetPermissionsAsync(UserProfile user, CancellationToken cancellationToken)
    {
        var forms = new Dictionary<string, PermissionFlags>(StringComparer.OrdinalIgnoreCase);
        var actions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        const string sql = """
            SELECT p.resource_code, p.action_code
            FROM app_permissions p
            INNER JOIN app_role_permissions rp ON rp.permission_id = p.id
            INNER JOIN app_user_roles ur ON ur.role_id = rp.role_id
            WHERE ur.user_id = @id
            """;
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", user.Id);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var resource = reader.GetString("resource_code");
            var action = reader.GetString("action_code");
            actions.Add($"{resource}:{action}");
            forms[resource] = Merge(forms.GetValueOrDefault(resource), action);
        }
        return new PermissionSet(forms, actions);
    }

    private async Task<UserProfile?> FindExternalUserAsync(string subject, CancellationToken cancellationToken)
    {
        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand("""
            SELECT u.id, u.username, u.display_name, u.email
            FROM app_external_identities x
            INNER JOIN app_users u ON u.id = x.user_id
            WHERE x.provider = 'tfs' AND x.subject = @subject
              AND u.status = 'ACTIVE'
              AND (u.locked_until IS NULL OR u.locked_until < UTC_TIMESTAMP(6))
            LIMIT 1
            """, connection);
        command.Parameters.AddWithValue("@subject", subject);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        return new UserProfile(reader.GetGuid("id"), reader.GetString("username"), reader.GetString("display_name"), reader.IsDBNull(reader.GetOrdinal("email")) ? null : reader.GetString("email"), []);
    }

    private static PermissionFlags Merge(PermissionFlags? current, string action)
    {
        var value = current ?? new PermissionFlags(false, false, false, false, false, false, false, false, false, false);
        return action.ToUpperInvariant() switch
        {
            "ACCESS" => value with { CanAccess = true }, "VIEW" => value with { CanView = true }, "ADD" => value with { CanAdd = true },
            "EDIT" => value with { CanEdit = true }, "DELETE" => value with { CanDelete = true }, "IMPORT" => value with { CanImport = true },
            "EXPORT" => value with { CanExport = true }, "APPROVE" => value with { CanApprove = true }, "PAY" => value with { CanPay = true },
            "COMPLETE" => value with { CanComplete = true }, _ => value
        };
    }
}

public sealed class TfsIdentityMappingException(string message, string code, int statusCode) : Exception(message)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
}
