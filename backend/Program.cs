using Microsoft.AspNetCore.Diagnostics;
using FiinGroupApp.Api.Auth;
using FiinGroupApp.Api.Database;
using FiinGroupApp.Api.Dashboard;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
var identityOptions = new IdentityStoreOptions
{
    Enabled = builder.Configuration.GetValue<bool>("IdentityStore:Enabled"),
    ConnectionString = builder.Configuration.GetConnectionString("Identity")
};
var tfsOptions = new TfsOptions
{
    Enabled = builder.Configuration.GetValue<bool>("Tfs:Enabled"),
    BaseUrl = builder.Configuration["Tfs:BaseUrl"],
    TimeoutSeconds = builder.Configuration.GetValue("Tfs:TimeoutSeconds", 15),
    RequireIdentityMapping = builder.Configuration.GetValue<bool>("Tfs:RequireIdentityMapping")
};
var sessionOptions = new TargetSessionOptions
{
    CookieName = builder.Configuration["Auth:SessionCookieName"] ?? "fiingroupapp_session",
    LifetimeHours = builder.Configuration.GetValue("Auth:SessionLifetimeHours", 8),
    SecureCookie = builder.Configuration.GetValue("Auth:SecureCookie", false)
};
var dashboardOptions = new DashboardOptions
{
    LegacyStatsEnabled = builder.Configuration.GetValue<bool>("Dashboard:LegacyStatsEnabled"),
    ConnectionString = builder.Configuration.GetConnectionString("LegacyOperational")
};
if (dashboardOptions.LegacyStatsEnabled && string.IsNullOrWhiteSpace(dashboardOptions.ConnectionString))
    throw new InvalidOperationException("Dashboard:LegacyStatsEnabled is true but ConnectionStrings:LegacyOperational is not configured.");
if (identityOptions.Enabled && string.IsNullOrWhiteSpace(identityOptions.ConnectionString))
    throw new InvalidOperationException("IdentityStore is enabled but ConnectionStrings:Identity is not configured.");
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
if (identityOptions.Enabled)
{
    builder.Services.AddSingleton<MySqlUserStore>(sp => new MySqlUserStore(identityOptions.ConnectionString!, sp.GetRequiredService<IPasswordHasher>()));
    builder.Services.AddSingleton<IUserStore>(sp => sp.GetRequiredService<MySqlUserStore>());
    builder.Services.AddSingleton<ITfsIdentityResolver>(sp => sp.GetRequiredService<MySqlUserStore>());
}
else
    builder.Services.AddSingleton<IUserStore>(sp => new DevelopmentUserStore(builder.Configuration, sp.GetRequiredService<IPasswordHasher>(), builder.Environment.IsDevelopment()));
builder.Services.AddHealthChecks().AddCheck("identity-store", new IdentityStoreHealthCheck(identityOptions.ConnectionString, identityOptions.Enabled));
builder.Services.AddSingleton<ITfsAuthenticationService>(new TfsAuthenticationService(tfsOptions));
builder.Services.AddSingleton<ITargetSessionStore>(new InMemoryTargetSessionStore(sessionOptions));
builder.Services.AddSingleton<IDashboardStatsReader>(new MySqlDashboardStatsReader(dashboardOptions));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"])
        .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();
app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    var feature = context.Features.Get<IExceptionHandlerFeature>();
    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    context.Response.ContentType = "application/json";
    await context.Response.WriteAsJsonAsync(new { success = false, error = new { code = "INTERNAL_ERROR", message = "Unexpected server error." } });
    app.Logger.LogError(feature?.Error, "Unhandled API exception");
}));
app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();
app.MapHealthChecks("/health");
app.MapGet("/api/v2/ping", () => Results.Ok(new { success = true, service = "fiingroup-app-api", version = "v2" }));
app.MapPost("/api/v2/auth/login", async (LoginRequest request, IAuthService auth, ITargetSessionStore sessions, HttpResponse response, CancellationToken cancellationToken) =>
{
    AuthenticatedUser? authenticated = null;
    var authProvider = string.Equals(request.AuthProvider, "tfs", StringComparison.OrdinalIgnoreCase) ? "tfs" : "local";
    if (!string.Equals(request.AuthProvider, "local", StringComparison.OrdinalIgnoreCase) && !string.Equals(request.AuthProvider, "tfs", StringComparison.OrdinalIgnoreCase))
        return Results.Json(new { success = false, message = "Unsupported authentication provider.", error = new { code = "AUTH_PROVIDER_UNSUPPORTED", message = "Unsupported authentication provider." } }, statusCode: StatusCodes.Status400BadRequest);
    if (string.Equals(request.AuthProvider, "tfs", StringComparison.OrdinalIgnoreCase))
    {
        var tfs = app.Services.GetRequiredService<ITfsAuthenticationService>();
        try
        {
            var result = await tfs.AuthenticateAsync(request, cancellationToken);
            var resolver = app.Services.GetService<ITfsIdentityResolver>();
            var mapped = resolver is null ? null : await resolver.ResolveAsync(result.Identity, cancellationToken);
            if (mapped is not null) authenticated = mapped;
            else if (tfsOptions.RequireIdentityMapping)
                throw new TfsAuthenticationException("TFS identity is not mapped to a FiinGroupApp user.", "TFS_IDENTITY_NOT_MAPPED", StatusCodes.Status403Forbidden);
            else authenticated = new AuthenticatedUser(result.User, result.Permissions);
        }
        catch (TfsAuthenticationException exception)
        {
            return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
        }
        catch (TfsIdentityMappingException exception)
        {
            return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
        }
    }
    else
    {
        authenticated = await auth.AuthenticateAsync(request, cancellationToken);
    }

    if (authenticated is null) return Results.Unauthorized();
    response.Cookies.Append(sessionOptions.CookieName, sessions.Create(authenticated), new CookieOptions
    {
        HttpOnly = true,
        Secure = sessionOptions.SecureCookie,
        SameSite = SameSiteMode.Lax,
        IsEssential = true,
        MaxAge = TimeSpan.FromHours(Math.Clamp(sessionOptions.LifetimeHours, 1, 24)),
        Path = "/"
    });
    return Results.Ok(new { success = true, user = authenticated.User, permissions = authenticated.Permissions, authProvider });
});
app.MapGet("/api/v2/auth/session", (HttpRequest request, ITargetSessionStore sessions) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    return authenticated is null
        ? Results.Unauthorized()
        : Results.Ok(new { success = true, user = authenticated.User, permissions = authenticated.Permissions });
});
app.MapGet("/api/v2/auth/me", (HttpRequest request, ITargetSessionStore sessions) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    return authenticated is null
        ? Results.Unauthorized()
        : Results.Ok(new { success = true, user = authenticated.User });
});
app.MapGet("/api/v2/auth/permissions", (HttpRequest request, ITargetSessionStore sessions) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    return authenticated is null
        ? Results.Unauthorized()
        : Results.Ok(new { success = true, permissions = authenticated.Permissions });
});
app.MapGet("/api/v2/dashboard/stats", async (HttpRequest request, ITargetSessionStore sessions, IDashboardStatsReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    if (string.IsNullOrWhiteSpace(sessionId)) return Results.Unauthorized();
    var authenticated = sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!DashboardAuthorization.CanRead(authenticated))
        return Results.Json(new { success = false, message = "Dashboard permission is required.", error = new { code = "DASHBOARD_FORBIDDEN", message = "Dashboard permission is required." } }, statusCode: StatusCodes.Status403Forbidden);
    try
    {
        var stats = await reader.ReadAsync(cancellationToken);
        return Results.Ok(new { success = true, data = stats });
    }
    catch (DashboardStatsException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapPost("/api/v2/auth/logout", (HttpRequest request, HttpResponse response, ITargetSessionStore sessions) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    if (!string.IsNullOrWhiteSpace(sessionId)) sessions.Remove(sessionId);
    response.Cookies.Delete(sessionOptions.CookieName, new CookieOptions { Path = "/", Secure = sessionOptions.SecureCookie, SameSite = SameSiteMode.Lax });
    return Results.Ok(new { success = true });
});
app.Run();

public partial class Program { }
