using FiinGroupApp.Api.Auth;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace FiinGroupApp.Api.Tests;

public sealed class AuthServiceTests
{
    [Theory]
    [InlineData("DOMAIN\\alice", "", "alice", "DOMAIN")]
    [InlineData("DOMAIN\\alice", "OTHER", "alice", "OTHER")]
    [InlineData("alice", "DOMAIN", "alice", "DOMAIN")]
    public void Splits_domain_username_like_jarvis(string input, string domain, string expectedUsername, string expectedDomain)
    {
        var result = TfsAuthenticationService.SplitDomainUsername(input, domain);
        Assert.Equal(expectedUsername, result.Username);
        Assert.Equal(expectedDomain, result.Domain);
    }

    [Fact]
    public async Task Rejects_empty_credentials_without_calling_store()
    {
        var store = new FakeUserStore();
        var service = new AuthService(store);
        var result = await service.AuthenticateAsync(new LoginRequest(" ", ""), CancellationToken.None);
        Assert.Null(result);
        Assert.Equal(0, store.LookupCalls);
    }

    [Fact]
    public async Task Rejects_unknown_user()
    {
        var store = new FakeUserStore();
        var service = new AuthService(store);
        var result = await service.AuthenticateAsync(new LoginRequest("missing", "password"), CancellationToken.None);
        Assert.Null(result);
        Assert.Equal(1, store.LookupCalls);
        Assert.Equal(0, store.PasswordCalls);
    }

    [Fact]
    public async Task Returns_user_and_permissions_after_password_verification()
    {
        var user = new UserProfile(Guid.NewGuid(), "alice", "Alice", "alice@example.test", ["ENGINEERING"]);
        var permissions = new PermissionSet(new Dictionary<string, PermissionFlags> { ["dashboard"] = new(true, true, false, false, false, false, false, false, false, false) }, new HashSet<string> { "dashboard:VIEW" });
        var store = new FakeUserStore(user, true, permissions);
        var service = new AuthService(store);
        var result = await service.AuthenticateAsync(new LoginRequest(" alice ", "password"), CancellationToken.None);
        Assert.NotNull(result);
        Assert.Equal("alice", result.User.Username);
        Assert.Same(permissions, result.Permissions);
    }

    private sealed class FakeUserStore(UserProfile? user = null, bool passwordValid = false, PermissionSet? permissions = null) : IUserStore
    {
        public int LookupCalls { get; private set; }
        public int PasswordCalls { get; private set; }
        public Task<UserProfile?> FindByUsernameAsync(string username, CancellationToken cancellationToken) { LookupCalls++; return Task.FromResult(user); }
        public Task<bool> VerifyPasswordAsync(UserProfile user, string password, CancellationToken cancellationToken) { PasswordCalls++; return Task.FromResult(passwordValid); }
        public Task<PermissionSet> GetPermissionsAsync(UserProfile user, CancellationToken cancellationToken) => Task.FromResult(permissions ?? new PermissionSet(new Dictionary<string, PermissionFlags>(), new HashSet<string>()));
    }
}
