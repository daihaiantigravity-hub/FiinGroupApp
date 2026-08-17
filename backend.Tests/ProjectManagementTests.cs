using FiinGroupApp.Api.ProjectManagement;
using Xunit;

namespace FiinGroupApp.Api.Tests;

public sealed class ProjectManagementTests
{
    [Fact]
    public async Task Disabled_project_management_store_fails_without_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = false });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetProjectsAsync(CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_STORE_DISABLED", exception.Code);
        Assert.Equal(503, exception.StatusCode);
    }

    [Fact]
    public async Task Invalid_project_id_is_rejected_before_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = true, ConnectionString = "Server=127.0.0.1;Port=1;Database=test;User ID=test;Password=test" });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetTasksAsync(0, CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_PROJECT_ID_INVALID", exception.Code);
        Assert.Equal(400, exception.StatusCode);
    }

    [Fact]
    public async Task Invalid_workspace_project_id_is_rejected_before_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = true, ConnectionString = "Server=127.0.0.1;Port=1;Database=test;User ID=test;Password=test" });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetWorkspaceAsync(0, CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_PROJECT_ID_INVALID", exception.Code);
        Assert.Equal(400, exception.StatusCode);
    }

    [Fact]
    public async Task Disabled_workspace_store_fails_without_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = false });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetWorkspaceAsync(9901, CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_STORE_DISABLED", exception.Code);
        Assert.Equal(503, exception.StatusCode);
    }

    [Fact]
    public async Task Disabled_pmbok_store_fails_before_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = true, PmbokEnabled = false, ConnectionString = "Server=127.0.0.1;Port=1;Database=test;User ID=test;Password=test" });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetPmbokWorkspaceAsync(9901, CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_PMBOK_DISABLED", exception.Code);
        Assert.Equal(503, exception.StatusCode);
    }
}
