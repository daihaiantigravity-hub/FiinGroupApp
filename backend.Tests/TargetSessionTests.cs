using FiinGroupApp.Api.Auth;
using System;
using System.Collections.Generic;
using Xunit;

namespace FiinGroupApp.Api.Tests;

public sealed class TargetSessionTests
{
    [Fact]
    public void Creates_reads_and_revokes_session()
    {
        var store = new InMemoryTargetSessionStore(new TargetSessionOptions { LifetimeHours = 1 });
        var authenticated = new AuthenticatedUser(
            new UserProfile(Guid.NewGuid(), "DOMAIN\\alice", "Alice", null, []),
            new PermissionSet(new Dictionary<string, PermissionFlags>(), new HashSet<string>()));

        var sessionId = store.Create(authenticated);

        Assert.NotEmpty(sessionId);
        Assert.Same(authenticated, store.Get(sessionId));
        store.Remove(sessionId);
        Assert.Null(store.Get(sessionId));
    }
}
