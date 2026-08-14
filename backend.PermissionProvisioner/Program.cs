using MySqlConnector;

var options = ParseArgs(args);
var required = new[] { "connection", "confirm-database", "username" };
if (required.Any(key => !options.ContainsKey(key)) || options.GetValueOrDefault("confirm-database") != "FiinGroupApp.Identity")
{
    Console.Error.WriteLine("Usage: dotnet run -- --connection <connection-string> --confirm-database FiinGroupApp.Identity --username <target-user>");
    return 2;
}

var connectionValue = options["connection"].Trim();
MySqlConnectionStringBuilder builder;
try { builder = new MySqlConnectionStringBuilder(connectionValue); }
catch (ArgumentException)
{
    Console.Error.WriteLine("Invalid --connection format.");
    return 8;
}
if (!string.Equals(builder.Database, "FiinGroupApp.Identity", StringComparison.OrdinalIgnoreCase))
{
    Console.Error.WriteLine("Refusing to provision: target database must be FiinGroupApp.Identity.");
    return 4;
}

var username = options["username"].Trim();
if (username.Length == 0 || IsPlaceholder(username))
{
    Console.Error.WriteLine("Target username is required and must not be a placeholder.");
    return 5;
}

await using var connection = new MySqlConnection(connectionValue);
await connection.OpenAsync();
var userId = await FindUserIdAsync(connection, username);
if (userId is null)
{
    Console.Error.WriteLine("Target user was not found. This tool never creates users.");
    return 6;
}

var roleId = await EnsureRoleAsync(connection);
foreach (var formCode in new[] { "pm-projects", "projectmanagement", "project-tasks" })
    await EnsurePermissionAsync(connection, roleId, formCode);
await EnsureUserRoleAsync(connection, userId.Value, roleId);

Console.WriteLine($"Granted read-only TFS project permissions to: {username}");
Console.WriteLine("Granted actions: ACCESS, VIEW only. No ADD, EDIT, DELETE, IMPORT, EXPORT or APPROVE permission was granted.");
return 0;

static async Task<Guid?> FindUserIdAsync(MySqlConnection connection, string username)
{
    await using var command = new MySqlCommand("SELECT id FROM app_users WHERE username = @username AND status = 'ACTIVE' LIMIT 1", connection);
    command.Parameters.AddWithValue("@username", username);
    var value = await command.ExecuteScalarAsync();
    return value is null || value is DBNull ? null : value is Guid guid ? guid : Guid.Parse(Convert.ToString(value)!);
}

static async Task<Guid> EnsureRoleAsync(MySqlConnection connection)
{
    const string code = "TFS_READONLY";
    await using var find = new MySqlCommand("SELECT id FROM app_roles WHERE code = @code LIMIT 1", connection);
    find.Parameters.AddWithValue("@code", code);
    var existing = await find.ExecuteScalarAsync();
    if (existing is not null && existing is not DBNull) return existing is Guid guid ? guid : Guid.Parse(Convert.ToString(existing)!);

    var id = Guid.NewGuid();
    await using var insert = new MySqlCommand("INSERT INTO app_roles (id, code, name) VALUES (@id, @code, @name)", connection);
    insert.Parameters.AddWithValue("@id", id);
    insert.Parameters.AddWithValue("@code", code);
    insert.Parameters.AddWithValue("@name", "TFS read-only project access");
    await insert.ExecuteNonQueryAsync();
    return id;
}

static async Task EnsurePermissionAsync(MySqlConnection connection, Guid roleId, string formCode)
{
    foreach (var action in new[] { "ACCESS", "VIEW" })
    {
        await using var find = new MySqlCommand("SELECT id FROM app_permissions WHERE resource_code = @resource AND action_code = @action LIMIT 1", connection);
        find.Parameters.AddWithValue("@resource", formCode);
        find.Parameters.AddWithValue("@action", action);
        var permissionValue = await find.ExecuteScalarAsync();
        var permissionId = permissionValue is not null && permissionValue is not DBNull
            ? permissionValue is Guid guid ? guid : Guid.Parse(Convert.ToString(permissionValue)!)
            : await InsertPermissionAsync(connection, formCode, action);

        await using var link = new MySqlCommand("INSERT IGNORE INTO app_role_permissions (role_id, permission_id) VALUES (@role, @permission)", connection);
        link.Parameters.AddWithValue("@role", roleId);
        link.Parameters.AddWithValue("@permission", permissionId);
        await link.ExecuteNonQueryAsync();
    }
}

static async Task<Guid> InsertPermissionAsync(MySqlConnection connection, string formCode, string action)
{
    var id = Guid.NewGuid();
    await using var insert = new MySqlCommand("INSERT INTO app_permissions (id, resource_code, action_code) VALUES (@id, @resource, @action)", connection);
    insert.Parameters.AddWithValue("@id", id);
    insert.Parameters.AddWithValue("@resource", formCode);
    insert.Parameters.AddWithValue("@action", action);
    await insert.ExecuteNonQueryAsync();
    return id;
}

static async Task EnsureUserRoleAsync(MySqlConnection connection, Guid userId, Guid roleId)
{
    await using var link = new MySqlCommand("INSERT IGNORE INTO app_user_roles (user_id, role_id) VALUES (@user, @role)", connection);
    link.Parameters.AddWithValue("@user", userId);
    link.Parameters.AddWithValue("@role", roleId);
    await link.ExecuteNonQueryAsync();
}

static Dictionary<string, string> ParseArgs(string[] args)
{
    var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    for (var i = 0; i + 1 < args.Length; i += 2) if (args[i].StartsWith("--")) result[args[i][2..]] = args[i + 1];
    return result;
}

static bool IsPlaceholder(string value) => value.StartsWith("<", StringComparison.Ordinal) && value.EndsWith(">", StringComparison.Ordinal);
