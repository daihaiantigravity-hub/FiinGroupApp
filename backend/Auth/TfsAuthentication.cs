using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace FiinGroupApp.Api.Auth;

public sealed class TfsOptions
{
    public bool Enabled { get; init; }
    public string? BaseUrl { get; init; }
    public int TimeoutSeconds { get; init; } = 15;
}

public sealed record TfsIdentity(string Username, string? Domain, string UniqueName, string DisplayName, string IdentityId);
public sealed record TfsLoginResult(UserProfile User, PermissionSet Permissions);

public interface ITfsAuthenticationService
{
    Task<TfsLoginResult> AuthenticateAsync(LoginRequest request, CancellationToken cancellationToken);
}

public sealed class TfsAuthenticationService(TfsOptions options) : ITfsAuthenticationService
{
    public async Task<TfsLoginResult> AuthenticateAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        if (!options.Enabled) throw new TfsAuthenticationException("TFS authentication is disabled.", StatusCodes.Status503ServiceUnavailable);
        if (string.IsNullOrWhiteSpace(options.BaseUrl)) throw new TfsAuthenticationException("TFS base URL is not configured.", StatusCodes.Status503ServiceUnavailable);
        var (username, domain) = SplitDomainUsername(request.Username, request.Domain);
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(request.Password)) throw new TfsAuthenticationException("TFS username and password are required.", StatusCodes.Status400BadRequest);

        using var handler = new HttpClientHandler
        {
            Credentials = new NetworkCredential(username, request.Password, string.IsNullOrWhiteSpace(domain) ? null : domain),
            PreAuthenticate = false,
            UseCookies = false
        };
        using var client = new HttpClient(handler) { BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/"), Timeout = TimeSpan.FromSeconds(Math.Max(1, options.TimeoutSeconds)) };
        client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
        try
        {
            using var response = await client.GetAsync("_apis/connectionData?connectOptions=1&lastChangeId=-1&lastChangeId64=-1", cancellationToken);
            if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden) throw new TfsAuthenticationException("TFS domain username or password is incorrect.", StatusCodes.Status401Unauthorized);
            if (!response.IsSuccessStatusCode) throw new TfsAuthenticationException("TFS authentication service is unavailable.", StatusCodes.Status503ServiceUnavailable);
            var payload = await response.Content.ReadFromJsonAsync<TfsConnectionData>(cancellationToken: cancellationToken) ?? new TfsConnectionData();
            var identity = payload.AuthenticatedUser ?? new TfsAuthenticatedUser();
            var login = string.IsNullOrWhiteSpace(domain) ? username : $"{domain}\\{username}";
            var fullName = string.IsNullOrWhiteSpace(identity.DisplayName) ? login : identity.DisplayName;
            var id = string.IsNullOrWhiteSpace(identity.Id) ? login : identity.Id;
            var user = new UserProfile(GuidFromTfsId(id), login, fullName, null, []);
            return new TfsLoginResult(user, new PermissionSet(new Dictionary<string, PermissionFlags>(), new HashSet<string>()));
        }
        catch (TfsAuthenticationException) { throw; }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested) { throw new TfsAuthenticationException("TFS authentication service timed out.", StatusCodes.Status503ServiceUnavailable); }
        catch (HttpRequestException) { throw new TfsAuthenticationException("TFS authentication service is unavailable.", StatusCodes.Status503ServiceUnavailable); }
    }

    public static (string Username, string? Domain) SplitDomainUsername(string username, string? domain)
    {
        var normalizedUsername = (username ?? string.Empty).Trim();
        var normalizedDomain = (domain ?? string.Empty).Trim();
        var separator = normalizedUsername.IndexOf('\\');
        if (string.IsNullOrWhiteSpace(normalizedDomain) && separator > 0) { normalizedDomain = normalizedUsername[..separator].Trim(); normalizedUsername = normalizedUsername[(separator + 1)..].Trim(); }
        return (normalizedUsername, string.IsNullOrWhiteSpace(normalizedDomain) ? null : normalizedDomain);
    }

    private static Guid GuidFromTfsId(string value) => Guid.TryParse(value, out var guid) ? guid : new Guid(System.Security.Cryptography.MD5.HashData(System.Text.Encoding.UTF8.GetBytes($"tfs:{value}")));

    private sealed class TfsConnectionData { [JsonPropertyName("authenticatedUser")] public TfsAuthenticatedUser? AuthenticatedUser { get; init; } }
    private sealed class TfsAuthenticatedUser { [JsonPropertyName("uniqueName")] public string? UniqueName { get; init; } [JsonPropertyName("displayName")] public string? DisplayName { get; init; } [JsonPropertyName("id")] public string? Id { get; init; } }
}

public sealed class TfsAuthenticationException(string message, int statusCode) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}
