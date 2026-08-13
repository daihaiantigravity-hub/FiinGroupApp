using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MySqlConnector;

const string usage = "Usage: dotnet run -- --connection <connection-string> --confirm-database FiinGroupApp.Identity [--manifest <path>]";
var argsMap = ParseArgs(args);
if (!argsMap.TryGetValue("connection", out var connectionString) || !argsMap.TryGetValue("confirm-database", out var confirmation))
{
    Console.Error.WriteLine(usage);
    return 2;
}

var builder = new MySqlConnectionStringBuilder(connectionString);
if (!string.Equals(builder.Database, "FiinGroupApp.Identity", StringComparison.OrdinalIgnoreCase) || !string.Equals(confirmation, "FiinGroupApp.Identity", StringComparison.Ordinal))
{
    Console.Error.WriteLine("Refusing to run: target database must be explicitly confirmed as FiinGroupApp.Identity.");
    return 3;
}

var manifestPath = argsMap.GetValueOrDefault("manifest") ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "backend", "Database", "Migrations", "migrations.json"));
if (!File.Exists(manifestPath)) { Console.Error.WriteLine($"Manifest not found: {manifestPath}"); return 4; }
var manifest = JsonSerializer.Deserialize<MigrationManifest>(await File.ReadAllTextAsync(manifestPath), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
if (manifest is null || !string.Equals(manifest.Database, "FiinGroupApp.Identity", StringComparison.OrdinalIgnoreCase) || manifest.Migrations is null || manifest.Migrations.Length == 0)
    throw new InvalidOperationException("Invalid migration manifest: expected database FiinGroupApp.Identity and a non-empty migrations list.");

await using var connection = new MySqlConnection(connectionString);
await connection.OpenAsync();
await using (var history = new MySqlCommand("CREATE TABLE IF NOT EXISTS app_schema_migrations (id VARCHAR(150) NOT NULL PRIMARY KEY, sha256 CHAR(64) NOT NULL, applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6))", connection)) await history.ExecuteNonQueryAsync();

foreach (var migration in manifest.Migrations)
{
    var filePath = Path.Combine(Path.GetDirectoryName(manifestPath)!, migration.File);
    if (!File.Exists(filePath)) throw new FileNotFoundException("Migration file not found", filePath);
    var bytes = await File.ReadAllBytesAsync(filePath);
    var checksum = Convert.ToHexString(SHA256.HashData(bytes));
    if (!checksum.Equals(migration.Sha256, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException($"Checksum mismatch for {migration.Id}.");
    await using var check = new MySqlCommand("SELECT sha256 FROM app_schema_migrations WHERE id = @id", connection);
    check.Parameters.AddWithValue("@id", migration.Id);
    var existing = await check.ExecuteScalarAsync();
    if (existing is string existingChecksum)
    {
        if (!existingChecksum.Equals(checksum, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException($"Applied migration checksum mismatch: {migration.Id}.");
        Console.WriteLine($"Already applied: {migration.Id}");
        continue;
    }
    Console.WriteLine($"Applying: {migration.Id}");
    foreach (var statement in SplitSql(Encoding.UTF8.GetString(bytes)))
    {
        await using var command = new MySqlCommand(statement, connection);
        await command.ExecuteNonQueryAsync();
    }
    await using var record = new MySqlCommand("INSERT INTO app_schema_migrations (id, sha256) VALUES (@id, @sha256)", connection);
    record.Parameters.AddWithValue("@id", migration.Id); record.Parameters.AddWithValue("@sha256", checksum);
    await record.ExecuteNonQueryAsync();
}
Console.WriteLine("Migration completed.");
return 0;

static Dictionary<string, string> ParseArgs(string[] args)
{
    var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    for (var i = 0; i < args.Length - 1; i += 2) if (args[i].StartsWith("--")) result[args[i][2..]] = args[i + 1];
    return result;
}

static IEnumerable<string> SplitSql(string sql)
{
    var withoutComments = string.Join('\n', sql.Split('\n').Where(line => !line.TrimStart().StartsWith("--")));
    return withoutComments.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Where(statement => statement.Length > 0);
}

file sealed record MigrationManifest(string Database, int Format, MigrationEntry[] Migrations);
file sealed record MigrationEntry(string Id, string File, string Sha256, bool Destructive, bool RequiresApproval);
