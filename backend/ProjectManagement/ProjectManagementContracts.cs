namespace FiinGroupApp.Api.ProjectManagement;

public sealed class ProjectManagementOptions
{
    public bool Enabled { get; init; }
    public bool PmbokEnabled { get; init; }
    public string? ConnectionString { get; init; }
}

public sealed record ProjectManagementProject(
    int Id,
    int? SourceProjectId,
    string ProjectManager,
    string Customer,
    string? ProjectCode,
    string? AnnexNo,
    string? AnnexName,
    int Status,
    decimal Amount,
    int ContractType,
    decimal PercentBudget,
    decimal Budget,
    string? StartDate,
    string? EndDate,
    string? SignDate,
    string? AcceptanceDate,
    int? WarrantyMonths,
    string? WarrantyEndDate,
    decimal? MaintenancePercent,
    string? NextActionDate,
    string? Remarks,
    decimal? CommissionPercent,
    decimal? CommissionAmount,
    string? ActiveBaseline);

public sealed record ProjectManagementTask(
    int Id,
    int ProjectId,
    int? ParentId,
    string TaskCode,
    string TaskName,
    string? Description,
    string? Product,
    string? StartDate,
    string? EndDate,
    decimal Progress,
    decimal Plan,
    int Priority,
    int TaskType,
    int Status,
    int SortOrder,
    string? CreatedBy,
    string? SourceSystem,
    string? SourceCollection,
    string? SourceProjectId,
    string? SourceId,
    int? SourceRevision,
    string? ActualStartDate,
    string? ActualEndDate,
    int Duration,
    decimal? Effort,
    bool IsCritical,
    string? Phase,
    string? DepartmentRole,
    string? SourceUrl);

public sealed record ProjectManagementTaskAssignee(
    int Id,
    int TaskId,
    string Assignee,
    int Role);

public sealed record ProjectManagementTaskDependency(
    int Id,
    int TaskId,
    int DependsOnId,
    int DependencyType,
    int LagDays);

public sealed record ProjectManagementTaskLog(
    int Id,
    int TaskId,
    string UpdatedBy,
    string FieldName,
    string? OldValue,
    string? NewValue,
    string? Note,
    string? CreatedAt);

public sealed record ProjectManagementTaskComment(
    int Id,
    int TaskId,
    string UserLogin,
    string Comment,
    int? ParentId,
    string? CreatedAt,
    string? UpdatedAt,
    int ReplyCount);

public sealed record ProjectManagementTaskAttachment(
    int Id,
    int TaskId,
    string UserLogin,
    string FileName,
    string FilePath,
    int? FileSize,
    string? FileType,
    string? CreatedAt);

public sealed record ProjectManagementTaskActivity(
    int Id,
    int ProjectId,
    int? TaskId,
    string UserLogin,
    string ActionType,
    string? FieldName,
    string? OldValue,
    string? NewValue,
    string? Description,
    string? CreatedAt,
    string? TaskCode,
    string? TaskName);

public sealed record ProjectManagementActivityPage(
    IReadOnlyList<ProjectManagementTaskActivity> Activities,
    int Total,
    int Limit,
    int Offset);

public sealed record ProjectManagementWorkloadTask(
    int Id,
    string TaskCode,
    string TaskName,
    string? StartDate,
    string? EndDate,
    decimal Progress,
    int Status,
    int Priority,
    int ProjectId,
    string? ProjectName);

public sealed record ProjectManagementWorkloadResource(
    string Assignee,
    int TotalTasks,
    int CompletedTasks,
    int OverdueTasks,
    int ActiveTasks,
    decimal AverageProgress,
    int Utilization,
    IReadOnlyList<ProjectManagementWorkloadTask> Tasks);

public sealed record ProjectManagementWorkload(
    string StartDate,
    string EndDate,
    int WorkingDays,
    IReadOnlyList<ProjectManagementWorkloadResource> Resources);

public sealed record ProjectManagementPayment(
    long Id,
    long ProjectId,
    int PaymentNo,
    string? ProcessDate,
    string? InvoiceDate,
    decimal PaymentPercent,
    decimal PaymentAmount,
    int Status,
    string? ActualPaymentDate,
    string? Remarks,
    int DocumentCount);

public sealed record ProjectManagementCostOther(
    long Id,
    int ProjectId,
    string CostType,
    string Phase,
    decimal Amount,
    string? ExecutorNotes,
    string? ProductType,
    int Status,
    string? Remarks,
    string? UpdatedAt);

public sealed record ProjectManagementPdca(
    long Id,
    int? ProjectId,
    string ReportDate,
    string Reporter,
    string IssueTitle,
    string? Description,
    string? Solution,
    int ProcessStatus,
    string? ProcessDate,
    string? FaultMembers,
    string? Notes,
    string? UpdatedAt);

public sealed record ProjectManagementRequest(
    long Id,
    int? ProjectId,
    string RequestDate,
    string Member,
    string? Manager,
    string RequestType,
    string Title,
    string Content,
    decimal? Amount,
    string? Reference,
    string? ProcessedDate,
    int Status,
    string? Approver,
    string? Notes,
    string? UpdatedAt);

public sealed record ProjectManagementCommission(
    long Id,
    int ProjectId,
    long PaymentId,
    int PaymentNo,
    decimal CommissionPercent,
    decimal CommissionAmount,
    int Status,
    string? Remarks,
    string? ExpectedDate,
    string? RecipientInfo,
    string? ActualDate);

public sealed record ProjectManagementPaymentDocument(
    long Id,
    long PaymentId,
    string DocName,
    int DocStatus,
    string? Attachment,
    string? Remarks,
    string? UpdatedAt);

public sealed record ProjectManagementCriticalPathTask(
    int Id,
    string TaskCode,
    string TaskName,
    int Duration,
    int EarlyStart,
    int EarlyFinish,
    int LateStart,
    int LateFinish,
    int Slack,
    bool IsCritical);

public sealed record ProjectManagementCriticalPath(
    int ProjectDuration,
    IReadOnlyList<ProjectManagementCriticalPathTask> CriticalPath,
    IReadOnlyList<ProjectManagementCriticalPathTask> AllTasks);

public sealed record ProjectManagementGanttTask(
    int Id,
    int? ParentId,
    string TaskCode,
    string TaskName,
    string? StartDate,
    string? EndDate,
    string? ActualStartDate,
    string? ActualEndDate,
    int Duration,
    decimal Progress,
    int Priority,
    int TaskType,
    int Status,
    int SortOrder,
    IReadOnlyList<string> Assignees);

public sealed record ProjectManagementGantt(
    ProjectManagementProject Project,
    IReadOnlyList<ProjectManagementGanttTask> Tasks,
    IReadOnlyList<ProjectManagementTaskDependency> Dependencies);

public sealed record ProjectManagementBaseline(
    string BaselineName,
    string CreatedBy,
    string? CreatedAt,
    int TaskCount);

public sealed record ProjectManagementBaselineTask(
    int Id,
    string TaskCode,
    string TaskName,
    string? ActualStart,
    string? ActualEnd,
    int ActualDuration,
    decimal Progress,
    int Status,
    string? PlannedStart,
    string? PlannedEnd,
    int? PlannedDuration,
    int? StartVariance,
    int? EndVariance,
    int? DurationVariance);

public sealed record ProjectManagementBaselineSummary(
    int TotalTasks,
    int TasksAhead,
    int TasksOnTime,
    int TasksBehind,
    decimal AverageStartVariance,
    decimal AverageEndVariance);

public sealed record ProjectManagementBaselineComparison(
    string BaselineName,
    IReadOnlyList<ProjectManagementBaselineTask> Tasks,
    ProjectManagementBaselineSummary Summary);

public sealed record ProjectManagementTaskDetails(
    ProjectManagementTask Task,
    IReadOnlyList<ProjectManagementTaskAssignee> Assignees,
    IReadOnlyList<ProjectManagementTaskDependency> Dependencies,
    IReadOnlyList<ProjectManagementTaskLog> Logs);

public sealed record ProjectManagementPlan(
    int Id,
    int Year,
    int Month,
    int Week,
    int SectionType,
    int EntryType,
    string? Customer,
    int? ProjectId,
    string TaskDescription,
    string? FromDate,
    string? ToDate,
    decimal CurrentProgress,
    decimal PlanProgress,
    decimal? ResultProgress,
    string? ResultNotes,
    string? Resource,
    string? Remarks,
    int SortOrder,
    int? SourcePlanId,
    string? CreatedBy,
    string? CreatedAt,
    int Status);

public sealed record ProjectManagementSummary(
    long Id,
    string? ProjectManager,
    int? Year,
    string? Customer,
    int ProjectId,
    string? AnnexName,
    decimal PlanPercent,
    decimal ActualPercent,
    int? Week,
    int SectionType,
    int EntryType,
    string? StartDate,
    string? EndDate,
    string? Notes,
    string? Resources,
    string? UpdatedBy,
    int Status);

public sealed record ProjectManagementSummaryQuery(
    int? Year,
    int? Week,
    int? ProjectId,
    string? Customer,
    string? ProjectManager,
    int? SectionType,
    int? Status,
    int Limit,
    int Offset);

public sealed record ProjectManagementSummaryListItem(
    ProjectManagementSummary Summary,
    int? ProjectRecordId,
    string? ProjectCode,
    string? AnnexNo,
    string? AnnexName,
    int? ContractType,
    int? ProjectStatus,
    string? ProjectManager);

public sealed record ProjectManagementSummaryPage(
    IReadOnlyList<ProjectManagementSummaryListItem> Rows,
    int Total,
    int Limit,
    int Offset);

public sealed record ProjectManagementSummaryProject(
    int Id,
    int? SourceProjectId,
    string? AnnexNo,
    string? AnnexName,
    string? Customer,
    string? ProjectManager,
    int Status,
    string? ProjectCode);

public sealed record ProjectManagementWorkspace(
    ProjectManagementProject Project,
    IReadOnlyList<ProjectManagementTaskDetails> Tasks,
    IReadOnlyList<ProjectManagementPlan> Plans,
    IReadOnlyList<ProjectManagementSummary> Summaries);

public sealed record ProjectManagementPlanQuery(
    int? Year,
    int? Week,
    int? ProjectId,
    string? Customer,
    string? ProjectManager,
    int? SectionType,
    int? Status,
    int Limit,
    int Offset,
    string Sort = "id",
    string Order = "desc");

public sealed record ProjectManagementPlanListItem(
    ProjectManagementPlan Plan,
    int? ProjectRecordId,
    string? ProjectCode,
    string? AnnexNo,
    string? AnnexName,
    string? ProjectManager);

public sealed record ProjectManagementPlanPage(
    IReadOnlyList<ProjectManagementPlanListItem> Rows,
    int Total,
    int Limit,
    int Offset);

public sealed record ProjectManagementProjectSummary(
    ProjectManagementProject Project,
    int TaskCount,
    int CompletedTaskCount,
    int ActiveTaskCount,
    int OverdueTaskCount,
    int DependencyCount,
    int PlanCount,
    decimal AverageProgress,
    decimal LatestPlanPercent,
    decimal LatestActualPercent,
    int? LatestSummaryYear,
    int? LatestSummaryWeek,
    string? LatestSummaryNotes);

public interface IProjectManagementReader
{
    Task<IReadOnlyList<ProjectManagementProject>> GetProjectsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementTask>> GetTasksAsync(int projectId, CancellationToken cancellationToken);
    Task<ProjectManagementGantt> GetGanttAsync(int projectId, CancellationToken cancellationToken);
    Task<ProjectManagementCriticalPath> GetCriticalPathAsync(int projectId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementBaseline>> GetBaselinesAsync(int projectId, CancellationToken cancellationToken);
    Task<ProjectManagementBaselineComparison> GetBaselineComparisonAsync(int projectId, string baselineName, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementTaskComment>> GetTaskCommentsAsync(int taskId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementTaskComment>> GetCommentRepliesAsync(int commentId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementTaskAttachment>> GetTaskAttachmentsAsync(int taskId, CancellationToken cancellationToken);
    Task<ProjectManagementActivityPage> GetProjectActivityAsync(int projectId, int? taskId, int limit, int offset, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementTaskActivity>> GetTaskActivityAsync(int taskId, int limit, CancellationToken cancellationToken);
    Task<ProjectManagementWorkload> GetWorkloadAsync(int? projectId, string? startDate, string? endDate, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementPayment>> GetProjectPaymentsAsync(int projectId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementCostOther>> GetProjectCostsOtherAsync(int projectId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementPdca>> GetProjectPdcaAsync(int projectId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementRequest>> GetProjectRequestsAsync(int projectId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementCommission>> GetProjectCommissionsAsync(int projectId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementPaymentDocument>> GetPaymentDocumentsAsync(long paymentId, CancellationToken cancellationToken);
    Task<ProjectManagementWorkspace> GetWorkspaceAsync(int projectId, CancellationToken cancellationToken);
    Task<ProjectManagementPlanPage> GetPlanPageAsync(ProjectManagementPlanQuery query, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementProjectSummary>> GetProjectSummariesAsync(CancellationToken cancellationToken);
    Task<ProjectManagementSummaryPage> GetSummaryPageAsync(ProjectManagementSummaryQuery query, CancellationToken cancellationToken);
    Task<ProjectManagementSummaryListItem?> GetSummaryAsync(long summaryId, CancellationToken cancellationToken);
    Task<IReadOnlyList<string>> GetSummaryCustomersAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<ProjectManagementSummaryProject>> GetSummaryProjectsAsync(string? customer, CancellationToken cancellationToken);
    Task<ProjectManagementPmbokWorkspace> GetPmbokWorkspaceAsync(int projectId, CancellationToken cancellationToken);
}

public sealed class ProjectManagementStoreException(string message, string code, int statusCode) : Exception(message)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
}
