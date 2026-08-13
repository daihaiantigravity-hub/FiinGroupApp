using FiinGroupApp.Api.Auth;
using FiinGroupApp.Api.Dashboard;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace FiinGroupApp.Api.Tests;

public sealed class DashboardTests
{
    [Fact]
    public void Requires_dashboard_access_and_view_permissions()
    {
        var noPermission = Authenticated(false, false);
        var accessOnly = Authenticated(true, false);
        var readable = Authenticated(true, true);

        Assert.False(DashboardAuthorization.CanRead(noPermission));
        Assert.False(DashboardAuthorization.CanRead(accessOnly));
        Assert.True(DashboardAuthorization.CanRead(readable));
    }

    [Fact]
    public async Task Disabled_reader_fails_without_opening_a_database_connection()
    {
        var reader = new MySqlDashboardStatsReader(new DashboardOptions { LegacyStatsEnabled = false });
        var error = await Assert.ThrowsAsync<DashboardStatsException>(() => reader.ReadAsync(CancellationToken.None));
        Assert.Equal("DASHBOARD_DATASTORE_NOT_CONFIGURED", error.Code);
    }

    private static AuthenticatedUser Authenticated(bool canAccess, bool canView)
    {
        var flags = new PermissionFlags(canAccess, canView, false, false, false, false, false, false, false, false);
        return new AuthenticatedUser(new UserProfile(Guid.NewGuid(), "alice", "Alice", null, []), new PermissionSet(new Dictionary<string, PermissionFlags> { ["dashboard"] = flags }, new HashSet<string>()));
    }
}
