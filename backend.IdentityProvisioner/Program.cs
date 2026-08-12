using FiinGroupApp.Api.Auth;
using MySqlConnector;

var options = ParseArgs(args);
if (!options.TryGetValue("connection", out var connectionString) || !options.TryGetValue("username", out var username) || !options.TryGetValue("display-name", out var displayName) || options.GetValueOrDefault("confirm-database") != "FiinGroupApp.Identity")
{
    Console.Error.WriteLine("Usage: dotnet run -- --connection <connection-string> --confirm-database FiinGroupApp.Identity --username <username> --display-name <name>");
    return 2;
}

var builder = new MySqlConnectionStringBuilder(connectionString);
if (!string.Equals(builder.Database, "FiinGroupApp.Identity", StringComparison.OrdinalIgnoreCase))
{
    Console.Error.WriteLine("Refusing to provision: target database must be FiinGroupApp.Identity.");
    return 3;
}

Console.Write("Password (input hidden): ");
var password = ReadSecret();
Console.WriteLine();
if (password.Length < 12) { Console.Error.WriteLine("Password must contain at least 12 characters."); return 4; }

var hasher = new Pbkdf2PasswordHasher();
var id = Guid.NewGuid();
await using var connection = new MySqlConnection(connectionString);
await connection.OpenAsync();
await using var command = new MySqlCommand("INSERT INTO app_users (id, username, display_name, password_hash) VALUES (@id, @username, @display_name, @password_hash)", connection);
command.Parameters.AddWithValue("@id", id);
command.Parameters.AddWithValue("@username", username.Trim());
command.Parameters.AddWithValue("@display_name", displayName.Trim());
command.Parameters.AddWithValue("@password_hash", hasher.Hash(password));
await command.ExecuteNonQueryAsync();
Console.WriteLine($"Provisioned user: {username.Trim()}");
return 0;

static Dictionary<string, string> ParseArgs(string[] args)
{
    var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    for (var i = 0; i + 1 < args.Length; i += 2) if (args[i].StartsWith("--")) result[args[i][2..]] = args[i + 1];
    return result;
}

static string ReadSecret()
{
    var chars = new List<char>();
    while (true)
    {
        var key = Console.ReadKey(intercept: true);
        if (key.Key == ConsoleKey.Enter) break;
        if (key.Key == ConsoleKey.Backspace) { if (chars.Count > 0) chars.RemoveAt(chars.Count - 1); continue; }
        if (!char.IsControl(key.KeyChar)) chars.Add(key.KeyChar);
    }
    return new string(chars.ToArray());
}
