using Microsoft.AspNetCore.Diagnostics;
using FiinGroupApp.Api.Auth;
using FiinGroupApp.Api.Database;
using FiinGroupApp.Api.Dashboard;
using FiinGroupApp.Api.ProjectManagement;
using FiinGroupApp.Api.Tfs;

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
    WriteEnabled = builder.Configuration.GetValue<bool>("Tfs:WriteEnabled"),
    BaseUrl = builder.Configuration["Tfs:BaseUrl"],
    Collection = builder.Configuration["Tfs:Collection"] ?? "DefaultCollection",
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
var projectManagementOptions = new ProjectManagementOptions
{
    Enabled = builder.Configuration.GetValue<bool>("ProjectManagement:Enabled"),
    PmbokEnabled = builder.Configuration.GetValue<bool>("ProjectManagement:PmbokEnabled"),
    ConnectionString = builder.Configuration.GetConnectionString("ProjectManagement")
};
if (dashboardOptions.LegacyStatsEnabled && string.IsNullOrWhiteSpace(dashboardOptions.ConnectionString))
    throw new InvalidOperationException("Dashboard:LegacyStatsEnabled is true but ConnectionStrings:LegacyOperational is not configured.");
if (identityOptions.Enabled && string.IsNullOrWhiteSpace(identityOptions.ConnectionString))
    throw new InvalidOperationException("IdentityStore is enabled but ConnectionStrings:Identity is not configured.");
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
if (identityOptions.Enabled)
{
    builder.Services.AddSingleton<MySqlUserStore>(sp => new MySqlUserStore(identityOptions.ConnectionString!, sp.GetRequiredService<IPasswordHasher>(), sp.GetRequiredService<ILogger<MySqlUserStore>>()));
    builder.Services.AddSingleton<IUserStore>(sp => sp.GetRequiredService<MySqlUserStore>());
    builder.Services.AddSingleton<ITfsIdentityResolver>(sp => sp.GetRequiredService<MySqlUserStore>());
}
else
    builder.Services.AddSingleton<IUserStore>(sp => new DevelopmentUserStore(builder.Configuration, sp.GetRequiredService<IPasswordHasher>(), builder.Environment.IsDevelopment()));
builder.Services.AddHealthChecks().AddCheck("identity-store", new IdentityStoreHealthCheck(identityOptions.ConnectionString, identityOptions.Enabled));
builder.Services.AddHealthChecks().AddCheck("project-management-store", new ProjectManagementHealthCheck(projectManagementOptions));
builder.Services.AddSingleton<ITfsAuthenticationService>(new TfsAuthenticationService(tfsOptions));
builder.Services.AddSingleton<ITfsProjectReader>(new TfsProjectReader(tfsOptions));
builder.Services.AddSingleton<ITargetSessionStore>(new InMemoryTargetSessionStore(sessionOptions));
builder.Services.AddSingleton<IDashboardStatsReader>(new MySqlDashboardStatsReader(dashboardOptions));
builder.Services.AddSingleton<IProjectManagementReader>(new MySqlProjectManagementReader(projectManagementOptions));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"])
        .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();
app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    var feature = context.Features.Get<IExceptionHandlerFeature>();
    var errorId = Guid.NewGuid().ToString("N");
    var detail = app.Environment.IsDevelopment() ? feature?.Error?.Message : null;
    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    context.Response.ContentType = "application/json";
    await context.Response.WriteAsJsonAsync(new { success = false, error = new { code = "INTERNAL_ERROR", errorId, message = "Unexpected server error.", detail } });
    app.Logger.LogError(feature?.Error, "Unhandled API exception {ErrorId}", errorId);
}));
app.UseCors();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.MapHealthChecks("/health");
app.MapGet("/api/v2/ping", () => Results.Ok(new { success = true, service = "fiingroup-app-api", version = "v2" }));
app.MapPost("/api/v2/auth/login", async (LoginRequest request, IAuthService auth, ITargetSessionStore sessions, HttpResponse response, CancellationToken cancellationToken) =>
{
    AuthenticatedUser? authenticated = null;
    TfsSessionCredential? tfsCredential = null;
    var authProvider = string.Equals(request.AuthProvider, "tfs", StringComparison.OrdinalIgnoreCase) ? "tfs" : "local";
    if (!string.Equals(request.AuthProvider, "local", StringComparison.OrdinalIgnoreCase) && !string.Equals(request.AuthProvider, "tfs", StringComparison.OrdinalIgnoreCase))
        return Results.Json(new { success = false, message = "Unsupported authentication provider.", error = new { code = "AUTH_PROVIDER_UNSUPPORTED", message = "Unsupported authentication provider." } }, statusCode: StatusCodes.Status400BadRequest);
    if (string.Equals(request.AuthProvider, "tfs", StringComparison.OrdinalIgnoreCase))
    {
        var tfs = app.Services.GetRequiredService<ITfsAuthenticationService>();
        try
        {
            var result = await tfs.AuthenticateAsync(request, cancellationToken);
            tfsCredential = result.Credential;
            var resolver = app.Services.GetService<ITfsIdentityResolver>();
            var mapped = resolver is null ? null : await resolver.ResolveAsync(result.Identity, cancellationToken);
            if (mapped is not null) authenticated = TfsAuthorization.GrantTfsWriteCapability(mapped, tfsOptions.WriteEnabled);
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
    response.Cookies.Append(sessionOptions.CookieName, sessions.Create(authenticated, tfsCredential), new CookieOptions
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
app.MapGet("/api/v2/tfs/projects", async (HttpRequest request, ITargetSessionStore sessions, ITfsProjectReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "pm-projects", "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();
    var credential = sessions.GetTfsCredential(sessionId!);
    if (credential is null)
        return Results.Json(new { success = false, error = new { code = "TFS_SESSION_CREDENTIAL_MISSING", message = "This session is not a TFS-authenticated session." } }, statusCode: StatusCodes.Status401Unauthorized);
    try
    {
        var projects = await reader.GetProjectsAsync(credential, cancellationToken);
        return Results.Ok(new { success = true, data = projects });
    }
    catch (TfsProjectException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/tfs/projects/{projectId}", async (string projectId, HttpRequest request, ITargetSessionStore sessions, ITfsProjectReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();
    var credential = sessions.GetTfsCredential(sessionId!);
    if (credential is null)
        return Results.Json(new { success = false, error = new { code = "TFS_SESSION_CREDENTIAL_MISSING", message = "This session is not a TFS-authenticated session." } }, statusCode: StatusCodes.Status401Unauthorized);
    try
    {
        var project = await reader.GetProjectAsync(credential, projectId, request.Query["collection"], cancellationToken);
        return project is null
            ? Results.NotFound(new { success = false, error = new { code = "TFS_PROJECT_NOT_FOUND", message = "TFS project was not found." } })
            : Results.Ok(new { success = true, data = project });
    }
    catch (TfsProjectException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/tfs/projects/{projectId}/teams", async (string projectId, HttpRequest request, ITargetSessionStore sessions, ITfsProjectReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();
    var credential = sessions.GetTfsCredential(sessionId!);
    if (credential is null) return Results.Unauthorized();
    try
    {
        var teams = await reader.GetTeamsAsync(credential, projectId, request.Query["collection"], cancellationToken);
        return Results.Ok(new { success = true, data = teams });
    }
    catch (TfsProjectException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/tfs/projects/{projectId}/iterations", async (string projectId, HttpRequest request, ITargetSessionStore sessions, ITfsProjectReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();
    var credential = sessions.GetTfsCredential(sessionId!);
    if (credential is null) return Results.Unauthorized();
    try
    {
        var iterations = await reader.GetIterationsAsync(credential, projectId, request.Query["collection"], cancellationToken);
        return Results.Ok(new { success = true, data = iterations });
    }
    catch (TfsProjectException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/tfs/projects/{projectId}/work-item-types", async (string projectId, HttpRequest request, ITargetSessionStore sessions, ITfsProjectReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    var credential = sessions.GetTfsCredential(sessionId!);
    if (credential is null) return Results.Unauthorized();
    try
    {
        var types = await reader.GetWorkItemTypesAsync(credential, projectId, request.Query["collection"], cancellationToken);
        return Results.Ok(new { success = true, data = types });
    }
    catch (TfsProjectException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/tfs/projects/{projectId}/work-items", async (string projectId, HttpRequest request, ITargetSessionStore sessions, ITfsProjectReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    var credential = sessions.GetTfsCredential(sessionId!);
    if (credential is null) return Results.Unauthorized();
    var limit = int.TryParse(request.Query["limit"], out var parsedLimit) ? parsedLimit : 100;
    var offset = int.TryParse(request.Query["offset"], out var parsedOffset) ? parsedOffset : 0;
    try
    {
        var workItems = await reader.GetWorkItemsAsync(credential, projectId, request.Query["collection"], request.Query["projectName"], limit, offset, cancellationToken);
        return Results.Ok(new { success = true, data = workItems });
    }
    catch (TfsProjectException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/tfs/projects/{projectId}/work-items/{workItemId:int}", async (string projectId, int workItemId, HttpRequest request, ITargetSessionStore sessions, ITfsProjectReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    var credential = sessions.GetTfsCredential(sessionId!);
    if (credential is null) return Results.Unauthorized();
    try
    {
        var workItem = await reader.GetWorkItemAsync(credential, projectId, workItemId, request.Query["collection"], cancellationToken);
        return workItem is null
            ? Results.NotFound(new { success = false, error = new { code = "TFS_WORK_ITEM_NOT_FOUND", message = "TFS work item was not found." } })
            : Results.Ok(new { success = true, data = workItem });
    }
    catch (TfsProjectException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapPost("/api/v2/tfs/projects/{projectId}/work-items", async (string projectId, TfsCreateWorkItemRequest workItemRequest, HttpRequest request, ITargetSessionStore sessions, ITfsProjectReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanCreate(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.WriteForbidden();
    var credential = sessions.GetTfsCredential(sessionId!);
    if (credential is null) return Results.Unauthorized();
    try
    {
        var workItem = await reader.CreateWorkItemAsync(credential, projectId, request.Query["collection"], workItemRequest, cancellationToken);
        return Results.Created(workItem.Url ?? $"/api/v2/tfs/projects/{projectId}/work-items/{workItem.Id}", new { success = true, data = workItem });
    }
    catch (TfsProjectException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapPut("/api/v2/tfs/projects/{projectId}/work-items/{workItemId:int}", async (string projectId, int workItemId, TfsUpdateWorkItemRequest workItemRequest, HttpRequest request, ITargetSessionStore sessions, ITfsProjectReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanEdit(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.WriteForbidden();
    var credential = sessions.GetTfsCredential(sessionId!);
    if (credential is null) return Results.Unauthorized();
    try
    {
        var workItem = await reader.UpdateWorkItemAsync(credential, projectId, workItemId, request.Query["collection"], workItemRequest, cancellationToken);
        return Results.Ok(new { success = true, data = workItem });
    }
    catch (TfsProjectException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapDelete("/api/v2/tfs/projects/{projectId}/work-items/{workItemId:int}", async (string projectId, int workItemId, HttpRequest request, ITargetSessionStore sessions, ITfsProjectReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanEdit(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.WriteForbidden();
    var credential = sessions.GetTfsCredential(sessionId!);
    if (credential is null) return Results.Unauthorized();
    var revision = int.TryParse(request.Query["revision"].ToString(), out var parsedRevision) ? parsedRevision : 0;
    try
    {
        var workItem = await reader.RemoveWorkItemAsync(credential, projectId, workItemId, request.Query["collection"], revision, cancellationToken);
        return Results.Ok(new { success = true, data = workItem });
    }
    catch (TfsProjectException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/project-management/projects", async (HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();
    try
    {
        var projects = await reader.GetProjectsAsync(cancellationToken);
        return Results.Ok(new { success = true, data = projects });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/summary", async (HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();
    try
    {
        var summaries = await reader.GetProjectSummariesAsync(cancellationToken);
        return Results.Ok(new { success = true, data = summaries });
    }
    catch (ProjectManagementStoreException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/project-management/summaries", async (HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();

    int? ReadOptionalInt(string name)
    {
        var raw = request.Query[name].ToString();
        return string.IsNullOrWhiteSpace(raw) ? null : int.TryParse(raw, out var value) ? value : null;
    }

    try
    {
        var page = await reader.GetSummaryPageAsync(new ProjectManagementSummaryQuery(
            ReadOptionalInt("year"),
            ReadOptionalInt("week"),
            ReadOptionalInt("projectId"),
            request.Query["customer"].ToString(),
            request.Query["projectManager"].ToString(),
            ReadOptionalInt("sectionType"),
            ReadOptionalInt("status"),
            Math.Clamp(ReadOptionalInt("limit") ?? 50, 1, 200),
            Math.Max(ReadOptionalInt("offset") ?? 0, 0)), cancellationToken);
        return Results.Ok(new
        {
            success = true,
            data = new
            {
                rows = page.Rows,
                total = page.Total,
                limit = page.Limit,
                offset = page.Offset,
                hasMore = page.Offset + page.Rows.Count < page.Total
            }
        });
    }
    catch (ProjectManagementStoreException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/project-management/summaries/{summaryId:long}", async (long summaryId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();
    try
    {
        var summary = await reader.GetSummaryAsync(summaryId, cancellationToken);
        return summary is null
            ? Results.NotFound(new { success = false, error = new { code = "PROJECT_MANAGEMENT_SUMMARY_NOT_FOUND", message = "Project summary was not found." } })
            : Results.Ok(new { success = true, data = summary });
    }
    catch (ProjectManagementStoreException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/project-management/summary-customers", async (HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();
    try
    {
        var customers = await reader.GetSummaryCustomersAsync(cancellationToken);
        return Results.Ok(new { success = true, data = customers });
    }
    catch (ProjectManagementStoreException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/project-management/summary-projects", async (HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();
    try
    {
        var projects = await reader.GetSummaryProjectsAsync(request.Query["customer"].ToString(), cancellationToken);
        return Results.Ok(new { success = true, data = projects });
    }
    catch (ProjectManagementStoreException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/project-management/task-plans", async (HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();

    int? ReadOptionalInt(string name)
    {
        var raw = request.Query[name].ToString();
        return string.IsNullOrWhiteSpace(raw) ? null : int.TryParse(raw, out var value) ? value : null;
    }

    try
    {
        var page = await reader.GetPlanPageAsync(new ProjectManagementPlanQuery(
            ReadOptionalInt("year"),
            ReadOptionalInt("week"),
            ReadOptionalInt("projectId"),
            request.Query["customer"].ToString(),
            request.Query["projectManager"].ToString(),
            ReadOptionalInt("sectionType"),
            ReadOptionalInt("status"),
            Math.Clamp(ReadOptionalInt("limit") ?? 50, 1, 200),
            Math.Max(ReadOptionalInt("offset") ?? 0, 0),
            request.Query["sort"].ToString(),
            request.Query["order"].ToString()), cancellationToken);
        return Results.Ok(new
        {
            success = true,
            data = new
            {
                rows = page.Rows,
                total = page.Total,
                limit = page.Limit,
                offset = page.Offset,
                hasMore = page.Offset + page.Rows.Count < page.Total
            }
        });
    }
    catch (ProjectManagementStoreException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/tasks", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var tasks = await reader.GetTasksAsync(projectId, cancellationToken);
        return Results.Ok(new { success = true, data = tasks });
    }
    catch (ProjectManagementStoreException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/payments", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var payments = await reader.GetProjectPaymentsAsync(projectId, cancellationToken);
        return Results.Ok(new { success = true, data = payments });
    }
    catch (ProjectManagementStoreException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/costs-other", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var costs = await reader.GetProjectCostsOtherAsync(projectId, cancellationToken);
        return Results.Ok(new { success = true, data = costs });
    }
    catch (ProjectManagementStoreException exception)
    {
        return Results.Json(new { success = false, message = exception.Message, error = new { code = exception.Code, message = exception.Message } }, statusCode: exception.StatusCode);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/pdca", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var pdca = await reader.GetProjectPdcaAsync(projectId, cancellationToken);
        return Results.Ok(new { success = true, data = pdca });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/requests", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var requests = await reader.GetProjectRequestsAsync(projectId, cancellationToken);
        return Results.Ok(new { success = true, data = requests });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/commissions", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var commissions = await reader.GetProjectCommissionsAsync(projectId, cancellationToken);
        return Results.Ok(new { success = true, data = commissions });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/payments/{paymentId:long}/documents", async (long paymentId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var documents = await reader.GetPaymentDocumentsAsync(paymentId, cancellationToken);
        return Results.Ok(new { success = true, data = documents });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/workload", async (HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var projectId = int.TryParse(request.Query["projectId"].ToString(), out var parsedProjectId) ? parsedProjectId : (int?)null;
        var workload = await reader.GetWorkloadAsync(projectId, request.Query["startDate"].ToString(), request.Query["endDate"].ToString(), cancellationToken);
        return Results.Ok(new { success = true, data = workload });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/gantt", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var gantt = await reader.GetGanttAsync(projectId, cancellationToken);
        return Results.Ok(new { success = true, data = gantt });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/export", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();

    try
    {
        var workspace = await reader.GetWorkspaceAsync(projectId, cancellationToken);
        var format = request.Query["format"].ToString();
        if (string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            static string Csv(string? value) => "\"" + (value ?? string.Empty).Replace("\"", "\"\"") + "\"";
            var lines = new List<string> { "task_code,task_name,description,start_date,end_date,duration,progress,status,priority,assignees,predecessors" };
            lines.AddRange(workspace.Tasks.Select(item =>
            {
                var task = item.Task;
                var assignees = string.Join(';', item.Assignees.Select(assignee => assignee.Assignee));
                var predecessors = string.Join(';', item.Dependencies.Select(dependency => dependency.DependsOnId));
                return string.Join(',', Csv(task.TaskCode), Csv(task.TaskName), Csv(task.Description), Csv(task.StartDate), Csv(task.EndDate), task.Duration.ToString(), task.Progress.ToString(System.Globalization.CultureInfo.InvariantCulture), task.Status.ToString(), task.Priority.ToString(), Csv(assignees), Csv(predecessors));
            }));
            return Results.Text("\uFEFF" + string.Join("\n", lines), "text/csv; charset=utf-8");
        }

        var tasks = workspace.Tasks.Select(item => new
        {
            id = item.Task.Id,
            task_code = item.Task.TaskCode,
            task_name = item.Task.TaskName,
            description = item.Task.Description,
            parent_id = item.Task.ParentId,
            start_date = item.Task.StartDate,
            end_date = item.Task.EndDate,
            duration = item.Task.Duration,
            progress = item.Task.Progress,
            status = item.Task.Status,
            priority = item.Task.Priority,
            assignees = item.Assignees.Select(assignee => assignee.Assignee).ToArray(),
            dependencies = item.Dependencies.Select(dependency => new { predecessor_id = dependency.DependsOnId, type = dependency.DependencyType, lag = dependency.LagDays }).ToArray()
        }).ToArray();
        return Results.Ok(new { success = true, data = new { project_id = projectId, exported_at = DateTime.UtcNow, task_count = tasks.Length, tasks } });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/critical-path", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var criticalPath = await reader.GetCriticalPathAsync(projectId, cancellationToken);
        return Results.Ok(new { success = true, data = criticalPath });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/baselines", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var baselines = await reader.GetBaselinesAsync(projectId, cancellationToken);
        return Results.Ok(new { success = true, data = baselines });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/baselines/compare", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var baselineName = request.Query["baselineName"].ToString();
        if (string.IsNullOrWhiteSpace(baselineName)) baselineName = request.Query["baseline_name"].ToString();
        var comparison = await reader.GetBaselineComparisonAsync(projectId, baselineName, cancellationToken);
        return Results.Ok(new { success = true, data = comparison });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/activity-log", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var taskId = int.TryParse(request.Query["taskId"].ToString(), out var parsedTaskId) ? parsedTaskId : (int?)null;
        var limit = int.TryParse(request.Query["limit"].ToString(), out var parsedLimit) ? parsedLimit : 50;
        var offset = int.TryParse(request.Query["offset"].ToString(), out var parsedOffset) ? parsedOffset : 0;
        var activities = await reader.GetProjectActivityAsync(projectId, taskId, limit, offset, cancellationToken);
        return Results.Ok(new { success = true, data = activities });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/tasks/{taskId:int}/activity-log", async (int taskId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var limit = int.TryParse(request.Query["limit"].ToString(), out var parsedLimit) ? parsedLimit : 30;
        var activities = await reader.GetTaskActivityAsync(taskId, limit, cancellationToken);
        return Results.Ok(new { success = true, data = activities });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/tasks/{taskId:int}/comments", async (int taskId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var comments = await reader.GetTaskCommentsAsync(taskId, cancellationToken);
        return Results.Ok(new { success = true, data = comments });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/comments/{commentId:int}/replies", async (int commentId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var replies = await reader.GetCommentRepliesAsync(commentId, cancellationToken);
        return Results.Ok(new { success = true, data = replies });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/tasks/{taskId:int}/attachments", async (int taskId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "project-tasks", "projectmanagement")) return TfsAuthorization.Forbidden();
    try
    {
        var attachments = await reader.GetTaskAttachmentsAsync(taskId, cancellationToken);
        return Results.Ok(new { success = true, data = attachments });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/workspace", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();
    try
    {
        var workspace = await reader.GetWorkspaceAsync(projectId, cancellationToken);
        return Results.Ok(new { success = true, data = workspace });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
});
app.MapGet("/api/v2/project-management/projects/{projectId:int}/pmbok", async (int projectId, HttpRequest request, ITargetSessionStore sessions, IProjectManagementReader reader, CancellationToken cancellationToken) =>
{
    var sessionId = request.Cookies[sessionOptions.CookieName];
    var authenticated = string.IsNullOrWhiteSpace(sessionId) ? null : sessions.Get(sessionId);
    if (authenticated is null) return Results.Unauthorized();
    if (!TfsAuthorization.CanRead(authenticated, "projectmanagement", "project-tasks")) return TfsAuthorization.Forbidden();
    try
    {
        var pmbok = await reader.GetPmbokWorkspaceAsync(projectId, cancellationToken);
        return Results.Ok(new { success = true, data = pmbok });
    }
    catch (ProjectManagementStoreException exception)
    {
        return ProjectManagementErrorResponse.Create(exception);
    }
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
