using Microsoft.AspNetCore.Diagnostics;
using FiinGroupApp.Api.Auth;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddSingleton<IUserStore, DevelopmentUserStore>();
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
    var result = await auth.AuthenticateAsync(request, cancellationToken);
    return result is null
        ? Results.Unauthorized()
        : Results.Ok(new { success = true, user = result.User, permissions = result.Permissions });
});
app.Run();

public partial class Program { }
