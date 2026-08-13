using MySqlConnector;

var options = ParseArgs(args);
var required = new[] { "connection", "confirm-database", "username", "provider", "subject" };
if (required.Any(key => !options.ContainsKey(key)) || options.GetValueOrDefault("confirm-database") != "FiinGroupApp.Identity")
{
    Console.Error.WriteLine("Usage: dotnet run -- --connection <connection-string> --confirm-database FiinGroupApp.Identity --username <target-user> --provider tfs --subject <tfs-identity-id> [--domain <domain>] [--unique-name <name>] [--display-name <name>]");
    return 2;
}

if (!string.Equals(options["provider"], "tfs", StringComparison.OrdinalIgnoreCase))
{
    Console.Error.WriteLine("Only provider=tfs is supported by this provisioner.");
    return 3;
}

var connectionValue = options["connection"].Trim();
if (IsPlaceholder(connectionValue))
{
    Console.Error.WriteLine("The --connection value is still a placeholder. Provide a real MySQL connection string, for example: Server=localhost;Port=33306;Database=FiinGroupApp.Identity;User ID=fiingroup_test;Password=<local-secret>");
    return 8;
}

MySqlConnectionStringBuilder connectionBuilder;
try
{
    connectionBuilder = new MySqlConnectionStringBuilder(connectionValue);
}
catch (ArgumentException)
{
    Console.Error.WriteLine("Invalid --connection format. Expected key/value pairs such as Server=localhost;Port=3306;Database=FiinGroupApp.Identity;User ID=...;Password=....");
    return 8;
}
if (!string.Equals(connectionBuilder.Database, "FiinGroupApp.Identity", StringComparison.OrdinalIgnoreCase))
{
    Console.Error.WriteLine("Refusing to provision: target database must be FiinGroupApp.Identity.");
    return 4;
}

var username = options["username"].Trim();
var subject = options["subject"].Trim();
if (IsPlaceholder(username) || IsPlaceholder(subject))
{
    Console.Error.WriteLine("Replace --username and --subject placeholders with real values. Subject may be the TFS authenticatedUser.id, uniqueName, or DOMAIN\\username.");
    return 5;
}
if (username.Length == 0 || subject.Length == 0)
{
    Console.Error.WriteLine("Target username and external subject are required.");
    return 5;
}

await using var connection = new MySqlConnection(connectionValue);
try
{
    await connection.OpenAsync();
}
catch (MySqlException)
{
    Console.Error.WriteLine("Could not connect to FiinGroupApp.Identity. Check that the database exists, the migration was applied, and the connection is reachable.");
    return 9;
}
var userId = await FindUserIdAsync(connection, username);
if (userId is null)
{
    Console.Error.WriteLine("Target user was not found. Provision the user first; this tool never creates users.");
    return 6;
}

var existing = await FindMappingAsync(connection, options["provider"], subject);
if (existing is not null)
{
    if (existing == userId) { Console.WriteLine("Mapping already exists for the requested target user."); return 0; }
    Console.Error.WriteLine("Refusing to overwrite an external identity mapped to another target user.");
    return 7;
}

await using var command = new MySqlCommand("""
    INSERT INTO app_external_identities (id, user_id, provider, subject, domain_name, unique_name, display_name)
    VALUES (@id, @user_id, @provider, @subject, @domain_name, @unique_name, @display_name)
    """, connection);
command.Parameters.AddWithValue("@id", Guid.NewGuid());
command.Parameters.AddWithValue("@user_id", userId.Value);
command.Parameters.AddWithValue("@provider", "tfs");
command.Parameters.AddWithValue("@subject", subject);
command.Parameters.AddWithValue("@domain_name", options.GetValueOrDefault("domain"));
command.Parameters.AddWithValue("@unique_name", options.GetValueOrDefault("unique-name"));
command.Parameters.AddWithValue("@display_name", options.GetValueOrDefault("display-name"));
await command.ExecuteNonQueryAsync();
Console.WriteLine($"Mapped TFS subject to target user: {username}");
return 0;

static async Task<Guid?> FindUserIdAsync(MySqlConnection connection, string username)
{
    await using var command = new MySqlCommand("SELECT id FROM app_users WHERE username = @username AND status = 'ACTIVE' LIMIT 1", connection);
    command.Parameters.AddWithValue("@username", username);
    var value = await command.ExecuteScalarAsync();
    return value is null || value is DBNull ? null : value is Guid guid ? guid : Guid.Parse(Convert.ToString(value)!);
}

static async Task<Guid?> FindMappingAsync(MySqlConnection connection, string provider, string subject)
{
    await using var command = new MySqlCommand("SELECT user_id FROM app_external_identities WHERE provider = @provider AND subject = @subject LIMIT 1", connection);
    command.Parameters.AddWithValue("@provider", provider);
    command.Parameters.AddWithValue("@subject", subject);
    var value = await command.ExecuteScalarAsync();
    return value is null || value is DBNull ? null : value is Guid guid ? guid : Guid.Parse(Convert.ToString(value)!);
}

static Dictionary<string, string> ParseArgs(string[] args)
{
    var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    for (var i = 0; i + 1 < args.Length; i += 2) if (args[i].StartsWith("--")) result[args[i][2..]] = args[i + 1];
    return result;
}

static bool IsPlaceholder(string value)
    => value.StartsWith("<", StringComparison.Ordinal) && value.EndsWith(">", StringComparison.Ordinal);
