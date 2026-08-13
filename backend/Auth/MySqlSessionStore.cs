using MySqlConnector;

namespace FiinGroupApp.Api.Auth;

public sealed class MySqlSessionStore(string connectionString, SessionTokenService tokenService) : ISessionStore
{
    private static readonly TimeSpan SessionLifetime = TimeSpan.FromDays(30);

    public async Task<RefreshSession> CreateAsync(UserProfile user, string? ipAddress, string? userAgent, CancellationToken cancellationToken)
    {
        var sessionId = Guid.NewGuid();
        var token = tokenService.CreateToken();
        var expiresAt = DateTimeOffset.UtcNow.Add(SessionLifetime);
        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand("INSERT INTO app_sessions (id, user_id, refresh_token_hash, expires_at, ip_address, user_agent) VALUES (@id, @user_id, @token_hash, @expires_at, @ip, @agent)", connection);
        command.Parameters.AddWithValue("@id", sessionId);
        command.Parameters.AddWithValue("@user_id", user.Id);
        command.Parameters.AddWithValue("@token_hash", SessionTokenService.HashToken(token));
        command.Parameters.AddWithValue("@expires_at", expiresAt.UtcDateTime);
        command.Parameters.AddWithValue("@ip", ipAddress);
        command.Parameters.AddWithValue("@agent", userAgent);
        await command.ExecuteNonQueryAsync(cancellationToken);
        return new RefreshSession(sessionId, user.Id, token, expiresAt);
    }

    public async Task<RefreshSession?> RotateAsync(string refreshToken, string? ipAddress, string? userAgent, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return null;
        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using var find = new MySqlCommand("SELECT id, user_id, expires_at FROM app_sessions WHERE refresh_token_hash = @token_hash AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP(6) FOR UPDATE", connection, transaction);
        find.Parameters.AddWithValue("@token_hash", SessionTokenService.HashToken(refreshToken));
        await using var reader = await find.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) { await transaction.RollbackAsync(cancellationToken); return null; }
        var oldSessionId = reader.GetGuid("id");
        var userId = reader.GetGuid("user_id");
        await reader.CloseAsync();

        await using var revoke = new MySqlCommand("UPDATE app_sessions SET revoked_at = UTC_TIMESTAMP(6), last_seen_at = UTC_TIMESTAMP(6) WHERE id = @id", connection, transaction);
        revoke.Parameters.AddWithValue("@id", oldSessionId);
        await revoke.ExecuteNonQueryAsync(cancellationToken);
        var newId = Guid.NewGuid();
        var newToken = tokenService.CreateToken();
        var expiresAt = DateTimeOffset.UtcNow.Add(SessionLifetime);
        await using var insert = new MySqlCommand("INSERT INTO app_sessions (id, user_id, refresh_token_hash, expires_at, ip_address, user_agent) VALUES (@id, @user_id, @token_hash, @expires_at, @ip, @agent)", connection, transaction);
        insert.Parameters.AddWithValue("@id", newId); insert.Parameters.AddWithValue("@user_id", userId); insert.Parameters.AddWithValue("@token_hash", SessionTokenService.HashToken(newToken)); insert.Parameters.AddWithValue("@expires_at", expiresAt.UtcDateTime); insert.Parameters.AddWithValue("@ip", ipAddress); insert.Parameters.AddWithValue("@agent", userAgent);
        await insert.ExecuteNonQueryAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new RefreshSession(newId, userId, newToken, expiresAt);
    }

    public async Task<bool> IsActiveAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand("SELECT EXISTS(SELECT 1 FROM app_sessions WHERE id = @id AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP(6))", connection);
        command.Parameters.AddWithValue("@id", sessionId);
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken)) == 1;
    }

    public async Task RevokeAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand("UPDATE app_sessions SET revoked_at = COALESCE(revoked_at, UTC_TIMESTAMP(6)) WHERE id = @id", connection);
        command.Parameters.AddWithValue("@id", sessionId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
