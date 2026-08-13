using Microsoft.AspNetCore.Diagnostics;
using FiinGroupApp.Api.Auth;
using FiinGroupApp.Api.Database;

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
    TimeoutSeconds = builder.Configuration.GetValue("Tfs:TimeoutSeconds", 15)
};
var sessionOptions = new TargetSessionOptions
{
    CookieName = builder.Configuration["Auth:SessionCookieName"] ?? "fiingroupapp_session",
    LifetimeHours = builder.Configuration.GetValue("Auth:SessionLifetimeHours", 8),
    SecureCookie = builder.Configuration.GetValue("Auth:SecureCookie", false)
};
if (identityOptions.Enabled && string.IsNullOrWhiteSpace(identityOptions.ConnectionString))
    throw new InvalidOperationException("IdentityStore is enabled but ConnectionStrings:Identity is not configured.");
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
if (identityOptions.Enabled)
    builder.Services.AddScoped<IUserStore>(sp => new MySqlUserStore(identityOptions.ConnectionString!, sp.GetRequiredService<IPasswordHasher>()));
else
    builder.Services.AddSingleton<IUserStore>(sp => new DevelopmentUserStore(builder.Configuration, sp.GetRequiredService<IPasswordHasher>(), builder.Environment.IsDevelopment()));
builder.Services.AddHealthChecks().AddCheck("identity-store", new IdentityStoreHealthCheck(identityOptions.ConnectionString, identityOptions.Enabled));
builder.Services.AddSingleton<ITfsAuthenticationService>(new TfsAuthenticationService(tfsOptions));
builder.Services.AddSingleton<ITargetSessionStore>(new InMemoryTargetSessionStore(sessionOptions));
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
            authenticated = new AuthenticatedUser(result.User, result.Permissions);
        }
        catch (TfsAuthenticationException exception)
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
app.MapPost("/api/v2/auth/logout", (HttpRequest request, HttpResponse response, ITargetSessionStore sessions) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    if (!string.IsNullOrWhiteSpace(sessionId)) sessions.Remove(sessionId);
    response.Cookies.Delete(sessionOptions.CookieName, new CookieOptions { Path = "/", Secure = sessionOptions.SecureCookie, SameSite = SameSiteMode.Lax });
    return Results.Ok(new { success = true });
});
app.Run();

public partial class Program { }
