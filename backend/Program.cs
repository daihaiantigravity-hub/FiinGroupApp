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
if (identityOptions.Enabled && string.IsNullOrWhiteSpace(identityOptions.ConnectionString))
    throw new InvalidOperationException("IdentityStore is enabled but ConnectionStrings:Identity is not configured.");
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
if (identityOptions.Enabled)
    builder.Services.AddScoped<IUserStore>(sp => new MySqlUserStore(identityOptions.ConnectionString!, sp.GetRequiredService<IPasswordHasher>()));
else
    builder.Services.AddSingleton<IUserStore>(sp => new DevelopmentUserStore(builder.Configuration, sp.GetRequiredService<IPasswordHasher>(), builder.Environment.IsDevelopment()));
builder.Services.AddHealthChecks().AddCheck("identity-store", new IdentityStoreHealthCheck(identityOptions.ConnectionString, identityOptions.Enabled));
builder.Services.AddSingleton<ITfsAuthenticationService>(new TfsAuthenticationService(tfsOptions));
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
app.MapPost("/api/v2/auth/login", async (LoginRequest request, IAuthService auth, CancellationToken cancellationToken) =>
{
    if (string.Equals(request.AuthProvider, "tfs", StringComparison.OrdinalIgnoreCase))
    {
        var tfs = app.Services.GetRequiredService<ITfsAuthenticationService>();
        try
        {
            var result = await tfs.AuthenticateAsync(request, cancellationToken);
            return Results.Ok(new { success = true, user = result.User, permissions = result.Permissions, authProvider = "tfs" });
        }
        catch (TfsAuthenticationException exception)
        {
            return Results.Json(new { success = false, message = exception.Message }, statusCode: exception.StatusCode);
        }
    }
    var localResult = await auth.AuthenticateAsync(request, cancellationToken);
    return localResult is null
        ? Results.Unauthorized()
        : Results.Ok(new { success = true, user = localResult.User, permissions = localResult.Permissions });
});
app.Run();

public partial class Program { }
