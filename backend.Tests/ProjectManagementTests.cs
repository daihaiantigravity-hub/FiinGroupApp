using FiinGroupApp.Api.ProjectManagement;
using Xunit;

namespace FiinGroupApp.Api.Tests;

public sealed class ProjectManagementTests
{
    [Fact]
    public void Critical_path_matches_source_forward_and_backward_passes()
    {
        var tasks = new[]
        {
            Task(1, "T1", 2),
            Task(2, "T2", 3),
            Task(3, "T3", 4)
        };
        var dependencies = new[]
        {
            new ProjectManagementTaskDependency(1, 2, 1, 1, 0),
            new ProjectManagementTaskDependency(2, 3, 2, 1, 1)
        };

        var result = CriticalPathCalculator.Calculate(tasks, dependencies);

        Assert.Equal(10, result.ProjectDuration);
        Assert.Equal(new[] { 1, 2, 3 }, result.CriticalPath.Select(item => item.Id));
        Assert.Equal(2, result.CriticalPath[1].EarlyStart);
        Assert.Equal(5, result.CriticalPath[1].EarlyFinish);
        Assert.All(result.CriticalPath, item => Assert.Equal(0, item.Slack));
    }

    [Fact]
    public void Critical_path_uses_one_day_for_zero_duration_like_source()
    {
        var result = CriticalPathCalculator.Calculate(new[] { Task(1, "T1", 0) }, Array.Empty<ProjectManagementTaskDependency>());

        Assert.Equal(1, result.ProjectDuration);
        Assert.Single(result.CriticalPath);
        Assert.Equal(1, result.CriticalPath[0].Duration);
    }

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
    public async Task Disabled_task_plan_store_fails_without_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = false });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetPlanPageAsync(new ProjectManagementPlanQuery(2026, 34, null, null, null, null, null, 50, 0), CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_STORE_DISABLED", exception.Code);
        Assert.Equal(503, exception.StatusCode);
    }

    [Fact]
    public async Task Disabled_project_summary_store_fails_without_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = false });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetProjectSummariesAsync(CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_STORE_DISABLED", exception.Code);
        Assert.Equal(503, exception.StatusCode);
    }

    [Fact]
    public async Task Disabled_weekly_summary_store_fails_without_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = false });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetSummaryPageAsync(new ProjectManagementSummaryQuery(2026, 34, null, null, null, 1, null, 50, 0), CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_STORE_DISABLED", exception.Code);
        Assert.Equal(503, exception.StatusCode);
    }

    [Fact]
    public async Task Invalid_weekly_summary_id_is_rejected_before_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = true, ConnectionString = "Server=127.0.0.1;Port=1;Database=test;User ID=test;Password=test" });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetSummaryAsync(0, CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_SUMMARY_ID_INVALID", exception.Code);
        Assert.Equal(400, exception.StatusCode);
    }

    [Fact]
    public async Task Disabled_baseline_store_fails_without_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = false });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetBaselinesAsync(9901, CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_STORE_DISABLED", exception.Code);
        Assert.Equal(503, exception.StatusCode);
    }

    [Fact]
    public async Task Empty_baseline_name_is_rejected_before_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = true, ConnectionString = "Server=127.0.0.1;Port=1;Database=test;User ID=test;Password=test" });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetBaselineComparisonAsync(9901, "", CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_BASELINE_NAME_REQUIRED", exception.Code);
        Assert.Equal(400, exception.StatusCode);
    }

    [Fact]
    public async Task Disabled_collaboration_store_fails_without_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = false });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetTaskCommentsAsync(19902, CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_STORE_DISABLED", exception.Code);
        Assert.Equal(503, exception.StatusCode);
    }

    [Fact]
    public async Task Disabled_gantt_store_fails_without_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = false });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetGanttAsync(9901, CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_STORE_DISABLED", exception.Code);
        Assert.Equal(503, exception.StatusCode);
    }

    [Fact]
    public async Task Invalid_task_activity_id_is_rejected_before_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = true, ConnectionString = "Server=127.0.0.1;Port=1;Database=test;User ID=test;Password=test" });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetTaskActivityAsync(0, 30, CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_TASK_ID_INVALID", exception.Code);
        Assert.Equal(400, exception.StatusCode);
    }

    [Fact]
    public async Task Disabled_pmbok_store_fails_before_database_call()
    {
        var reader = new MySqlProjectManagementReader(new ProjectManagementOptions { Enabled = true, PmbokEnabled = false, ConnectionString = "Server=127.0.0.1;Port=1;Database=test;User ID=test;Password=test" });

        var exception = await Assert.ThrowsAsync<ProjectManagementStoreException>(() => reader.GetPmbokWorkspaceAsync(9901, CancellationToken.None));

        Assert.Equal("PROJECT_MANAGEMENT_PMBOK_DISABLED", exception.Code);
        Assert.Equal(503, exception.StatusCode);
    }

    private static ProjectManagementTask Task(int id, string code, int duration) => new(
        id, 9901, null, code, code, null, null, null, null, 0, 0, 2, 1, 0, id,
        null, null, null, null, null, null, null, null, duration, null, false, null, null, null);
}
