using FiinGroupApp.Api.Auth;
using FiinGroupApp.Api.Tfs;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace FiinGroupApp.Api.Tests;

public sealed class TfsAuthorizationTests
{
    [Fact]
    public void Allows_read_when_any_legacy_project_form_is_readable()
    {
        var permissions = new PermissionSet(
            new Dictionary<string, PermissionFlags>
            {
                ["project-tasks"] = new(true, true, false, false, false, false, false, false, false, false)
            },
            new HashSet<string>());
        var user = new AuthenticatedUser(
            new UserProfile(Guid.NewGuid(), "alice", "Alice", null, []),
            permissions);

        Assert.True(TfsAuthorization.CanRead(user, "pm-projects", "projectmanagement", "project-tasks"));
    }

    [Fact]
    public void Denies_read_without_access_and_view()
    {
        var permissions = new PermissionSet(
            new Dictionary<string, PermissionFlags>
            {
                ["projectmanagement"] = new(true, false, false, false, false, false, false, false, false, false)
            },
            new HashSet<string>());
        var user = new AuthenticatedUser(
            new UserProfile(Guid.NewGuid(), "alice", "Alice", null, []),
            permissions);

        Assert.False(TfsAuthorization.CanRead(user, "projectmanagement"));
    }

    [Fact]
    public void Allows_create_only_when_add_is_granted()
    {
        var readable = new AuthenticatedUser(
            new UserProfile(Guid.NewGuid(), "alice", "Alice", null, []),
            new PermissionSet(
                new Dictionary<string, PermissionFlags>
                {
                    ["project-tasks"] = new(true, true, false, false, false, false, false, false, false, false)
                },
                new HashSet<string>()));
        var creator = new AuthenticatedUser(
            new UserProfile(Guid.NewGuid(), "alice", "Alice", null, []),
            new PermissionSet(
                new Dictionary<string, PermissionFlags>
                {
                    ["project-tasks"] = new(true, true, true, false, false, false, false, false, false, false)
                },
                new HashSet<string>()));

        Assert.False(TfsAuthorization.CanCreate(readable, "project-tasks"));
        Assert.True(TfsAuthorization.CanCreate(creator, "project-tasks"));
    }

    [Fact]
    public void Allows_edit_only_when_edit_is_granted()
    {
        var permissions = new PermissionSet(
            new Dictionary<string, PermissionFlags>
            {
                ["project-tasks"] = new(true, true, false, true, false, false, false, false, false, false)
            },
            new HashSet<string>());
        var user = new AuthenticatedUser(
            new UserProfile(Guid.NewGuid(), "alice", "Alice", null, []),
            permissions);

        Assert.True(TfsAuthorization.CanEdit(user, "project-tasks"));
    }

    [Fact]
    public async Task Invalid_tfs_base_url_is_rejected_before_network_call()
    {
        var reader = new TfsProjectReader(new TfsOptions { Enabled = true, BaseUrl = "not-a-url" });

        var exception = await Assert.ThrowsAsync<TfsProjectException>(() => reader.GetProjectsAsync(
            new TfsSessionCredential("alice", "DOMAIN", "password"),
            CancellationToken.None));

        Assert.Equal("TFS_URL_INVALID", exception.Code);
        Assert.Equal(503, exception.StatusCode);
    }

    [Fact]
    public async Task Create_is_rejected_before_network_call_when_tfs_writes_are_disabled()
    {
        var reader = new TfsProjectReader(new TfsOptions
        {
            Enabled = true,
            BaseUrl = "http://127.0.0.1:8080",
            WriteEnabled = false
        });

        var exception = await Assert.ThrowsAsync<TfsProjectException>(() => reader.CreateWorkItemAsync(
            new TfsSessionCredential("alice", "DOMAIN", "password"),
            "project-id",
            "Collection",
            new TfsCreateWorkItemRequest("Task", "New task", null, null, null, null, null, null, null, null),
            CancellationToken.None));

        Assert.Equal("TFS_WRITE_DISABLED", exception.Code);
        Assert.Equal(403, exception.StatusCode);
    }

    [Fact]
    public async Task Update_is_rejected_before_network_call_when_tfs_writes_are_disabled()
    {
        var reader = new TfsProjectReader(new TfsOptions
        {
            Enabled = true,
            BaseUrl = "http://127.0.0.1:8080",
            WriteEnabled = false
        });

        var exception = await Assert.ThrowsAsync<TfsProjectException>(() => reader.UpdateWorkItemAsync(
            new TfsSessionCredential("alice", "DOMAIN", "password"),
            "project-id",
            42,
            "Collection",
            new TfsUpdateWorkItemRequest(1, "Updated task", null, null, null, null, null, null, null, null),
            CancellationToken.None));

        Assert.Equal("TFS_WRITE_DISABLED", exception.Code);
        Assert.Equal(403, exception.StatusCode);
    }
}
