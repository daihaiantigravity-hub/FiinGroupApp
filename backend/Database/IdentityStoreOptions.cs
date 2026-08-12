namespace FiinGroupApp.Api.Database;

public sealed class IdentityStoreOptions
{
    public bool Enabled { get; init; }
    public string? ConnectionString { get; init; }
}
