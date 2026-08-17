namespace FiinGroupApp.Api.ProjectManagement;

public sealed record ProjectManagementCharter(
    long Id,
    long ProjectId,
    string? BusinessCase,
    string? Objectives,
    string? InScope,
    string? OutScope,
    string? Deliverables,
    string? Assumptions,
    string? Constraints,
    string? HighRisks,
    string? Sponsor,
    string? ProductOwner,
    int ApprovalStatus,
    string? ApprovedBy,
    string? ApprovedAt,
    int Status);

public sealed record ProjectManagementStakeholder(
    long Id,
    long ProjectId,
    string StakeholderType,
    string? Member,
    string? PartnerCode,
    string? Name,
    string? Role,
    string? Power,
    string? Interest,
    string? Expectation,
    string? EngagementStrategy,
    string? Owner,
    int Status);

public sealed record ProjectManagementResource(
    long Id,
    long ProjectId,
    string? Member,
    string? Role,
    string? SubTeam,
    decimal? Effort,
    decimal? UnitRate,
    decimal? PlannedMandays,
    int Status);

public sealed record ProjectManagementRaci(
    long Id,
    long ProjectId,
    string Activity,
    string Role,
    string? RaciValue,
    int SortOrder,
    int Status);

public sealed record ProjectManagementRisk(
    long Id,
    long ProjectId,
    string? RiskCode,
    string? Description,
    string? Category,
    int? Probability,
    int? Impact,
    int Score,
    string? Response,
    string? Owner,
    string? TriggerDescription,
    string? ReviewDate,
    int Status);

public sealed record ProjectManagementCostPlan(
    long Id,
    long ProjectId,
    string? ItemName,
    string? Description,
    decimal? Amount,
    bool IsContingency,
    decimal? ContingencyPercent,
    int SortOrder,
    int Status);

public sealed record ProjectManagementQualityPlan(
    long Id,
    long ProjectId,
    string? Criteria,
    string? AppliesTo,
    string? VerifyMethod,
    string? AcceptanceStandard,
    string? Owner,
    int SortOrder,
    int Status);

public sealed record ProjectManagementDefinitionOfDone(
    long Id,
    long ProjectId,
    string ItemText,
    int SortOrder,
    int Status);

public sealed record ProjectManagementCommunicationPlan(
    long Id,
    long ProjectId,
    string? Activity,
    string? Purpose,
    string? Audience,
    string? Frequency,
    string? Channel,
    string? Owner,
    int SortOrder,
    int Status);

public sealed record ProjectManagementChangeLog(
    long Id,
    long ProjectId,
    string? ChangeCode,
    string? ChangeDate,
    string? Description,
    string? RequestedBy,
    string? Reason,
    string? ImpactScope,
    string? ImpactTime,
    string? ImpactCost,
    decimal? EstimatedMandays,
    int Decision,
    string? Approver,
    int Status);

public sealed record ProjectManagementPmbokWorkspace(
    ProjectManagementCharter? Charter,
    IReadOnlyList<ProjectManagementStakeholder> Stakeholders,
    IReadOnlyList<ProjectManagementResource> Resources,
    IReadOnlyList<ProjectManagementRaci> Raci,
    IReadOnlyList<ProjectManagementRisk> Risks,
    IReadOnlyList<ProjectManagementCostPlan> CostPlans,
    IReadOnlyList<ProjectManagementQualityPlan> QualityPlans,
    IReadOnlyList<ProjectManagementDefinitionOfDone> DefinitionOfDone,
    IReadOnlyList<ProjectManagementCommunicationPlan> CommunicationPlans,
    IReadOnlyList<ProjectManagementChangeLog> ChangeLogs);
