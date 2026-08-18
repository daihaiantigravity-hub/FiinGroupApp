using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FiinGroupApp.Api.Auth;

namespace FiinGroupApp.Api.Tfs;

public sealed record TfsProjectSummary(string Collection, string Id, string Name, string? Description, string? State, string? Url);
public sealed record TfsTeamSummary(string Id, string Name, string? Description, string? Url);
public sealed record TfsIterationSummary(string Id, string Name, string? Path, string? TimeFrame, string? Url);
public sealed record TfsWorkItemTypeSummary(string Name, string? ReferenceName, string? Description, string? Url, IReadOnlyList<string> States);
public sealed record TfsWorkItemSummary(int Id, int Revision, string? Title, string? WorkItemType, string? State, string? AssignedTo, string? IterationPath, int? ParentId, string? StartDate, string? FinishDate, string? TargetDate, string? ClosedDate, int StatusCode, decimal Progress, decimal Plan, int PriorityCode, string? TaskCode, string? Product, string? CreatedBy, string? Url, decimal? Effort, IReadOnlyList<int> PredecessorIds, IReadOnlyDictionary<string, string> GeneratedFields);
public sealed record TfsWorkItemDetail(int Id, int Revision, string? Title, string? WorkItemType, string? State, string? AssignedTo, string? IterationPath, int? ParentId, string? Description, string? CreatedDate, string? ChangedDate, string? StartDate, string? FinishDate, string? TargetDate, string? Priority, string? Tags, string? History, int StatusCode, decimal Progress, decimal Plan, int PriorityCode, string? TaskCode, string? Product, string? CreatedBy, string? Url, decimal? Effort, IReadOnlyList<int> PredecessorIds, IReadOnlyDictionary<string, string> GeneratedFields);
public sealed record TfsWorkItemDependencyRequest(int PredecessorId, int DependencyType);
public sealed record TfsCreateWorkItemRequest(string? WorkItemType, string Title, string? Description, int? Priority, string? AssignedTo, string? IterationPath, string? StartDate, string? FinishDate, string? Tags, int? ParentId, string? Product, string? State, decimal? Effort, decimal? Progress, IReadOnlyList<TfsWorkItemDependencyRequest>? Dependencies);
public sealed record TfsUpdateWorkItemRequest(int Revision, string? Title, string? Description, int? Priority, string? AssignedTo, string? IterationPath, string? StartDate, string? FinishDate, string? Tags, int? ParentId, string? Product, string? State, decimal? Effort, decimal? Progress, IReadOnlyList<TfsWorkItemDependencyRequest>? Dependencies);

public interface ITfsProjectReader
{
    Task<IReadOnlyList<TfsProjectSummary>> GetProjectsAsync(TfsSessionCredential credential, CancellationToken cancellationToken);
    Task<TfsProjectSummary?> GetProjectAsync(TfsSessionCredential credential, string projectId, string? collection, CancellationToken cancellationToken);
    Task<IReadOnlyList<TfsTeamSummary>> GetTeamsAsync(TfsSessionCredential credential, string projectId, string? collection, CancellationToken cancellationToken);
    Task<IReadOnlyList<TfsIterationSummary>> GetIterationsAsync(TfsSessionCredential credential, string projectId, string? collection, CancellationToken cancellationToken);
    Task<IReadOnlyList<TfsWorkItemTypeSummary>> GetWorkItemTypesAsync(TfsSessionCredential credential, string projectId, string? collection, CancellationToken cancellationToken);
    Task<TfsWorkItemQueryResult> GetWorkItemsAsync(TfsSessionCredential credential, string projectId, string? collection, string? projectName, int limit, int offset, CancellationToken cancellationToken);
    Task<TfsWorkItemDetail?> GetWorkItemAsync(TfsSessionCredential credential, string projectId, int workItemId, string? collection, CancellationToken cancellationToken);
    Task<TfsWorkItemDetail> CreateWorkItemAsync(TfsSessionCredential credential, string projectId, string? collection, TfsCreateWorkItemRequest request, CancellationToken cancellationToken);
    Task<TfsWorkItemDetail> UpdateWorkItemAsync(TfsSessionCredential credential, string projectId, int workItemId, string? collection, TfsUpdateWorkItemRequest request, CancellationToken cancellationToken);
    Task<TfsWorkItemDetail> RemoveWorkItemAsync(TfsSessionCredential credential, string projectId, int workItemId, string? collection, int revision, CancellationToken cancellationToken);
}

public sealed record TfsWorkItemQueryResult(string Collection, string ProjectId, int TotalAvailable, IReadOnlyList<TfsWorkItemSummary> Items);

public sealed class TfsProjectReader(TfsOptions options) : ITfsProjectReader
{
    public async Task<IReadOnlyList<TfsProjectSummary>> GetProjectsAsync(TfsSessionCredential credential, CancellationToken cancellationToken)
    {
        using var client = CreateClient(credential);
        var collections = await GetCollectionsAsync(client, cancellationToken);
        var projects = new List<TfsProjectSummary>();
        TfsProjectException? firstCollectionError = null;
        foreach (var collection in collections)
        {
            try
            {
                var response = await SendAsync(client, $"{ValidateCollection(collection)}/_apis/projects?stateFilter=all&$top=100&api-version=2.0", cancellationToken);
                var payload = await response.Content.ReadFromJsonAsync<TfsListResponse<TfsProjectDto>>(cancellationToken: cancellationToken) ?? new TfsListResponse<TfsProjectDto>();
                projects.AddRange(payload.Value.Select(project => Map(collection, project)));
            }
            catch (TfsProjectException exception)
            {
                // A user may see a collection in connectionData but lack project
                // permission there. Continue with collections that are readable.
                firstCollectionError ??= exception;
            }
        }
        if (projects.Count == 0 && firstCollectionError is not null) throw firstCollectionError;
        return projects;
    }

    public async Task<TfsProjectSummary?> GetProjectAsync(TfsSessionCredential credential, string projectId, string? collectionOverride, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(projectId)) throw new TfsProjectException("Project id is required.", "TFS_PROJECT_ID_REQUIRED", StatusCodes.Status400BadRequest);
        var collection = ValidateCollection(string.IsNullOrWhiteSpace(collectionOverride) ? options.Collection : collectionOverride);
        using var client = CreateClient(credential);
        var response = await SendAsync(client, $"{collection}/_apis/projects/{Uri.EscapeDataString(projectId)}?api-version=2.0", cancellationToken, allowNotFound: true);
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        var project = await response.Content.ReadFromJsonAsync<TfsProjectDto>(cancellationToken: cancellationToken);
        return project is null ? null : Map(collection, project);
    }

    public async Task<IReadOnlyList<TfsTeamSummary>> GetTeamsAsync(TfsSessionCredential credential, string projectId, string? collectionOverride, CancellationToken cancellationToken)
    {
        var collection = ValidateCollection(string.IsNullOrWhiteSpace(collectionOverride) ? options.Collection : collectionOverride);
        var project = ValidateProjectId(projectId);
        using var client = CreateClient(credential);
        var response = await SendAsync(client, collection + "/_apis/projects/" + Uri.EscapeDataString(project) + "/teams?%24top=100&api-version=2.0", cancellationToken);
        var payload = await response.Content.ReadFromJsonAsync<TfsListResponse<TfsTeamDto>>(cancellationToken: cancellationToken) ?? new TfsListResponse<TfsTeamDto>();
        return payload.Value.Select(team => new TfsTeamSummary(team.Id ?? string.Empty, team.Name ?? string.Empty, team.Description, team.Url)).ToArray();
    }

    public async Task<IReadOnlyList<TfsIterationSummary>> GetIterationsAsync(TfsSessionCredential credential, string projectId, string? collectionOverride, CancellationToken cancellationToken)
    {
        var collection = ValidateCollection(string.IsNullOrWhiteSpace(collectionOverride) ? options.Collection : collectionOverride);
        var project = ValidateProjectId(projectId);
        using var client = CreateClient(credential);
        var response = await SendAsync(client, collection + "/" + Uri.EscapeDataString(project) + "/_apis/work/teamsettings/iterations?api-version=2.0-preview.1", cancellationToken);
        var payload = await response.Content.ReadFromJsonAsync<TfsListResponse<TfsIterationDto>>(cancellationToken: cancellationToken) ?? new TfsListResponse<TfsIterationDto>();
        return payload.Value.Select(iteration => new TfsIterationSummary(iteration.Id ?? string.Empty, iteration.Name ?? string.Empty, iteration.Path, iteration.Attributes?.TimeFrame, iteration.Url)).ToArray();
    }

    public async Task<IReadOnlyList<TfsWorkItemTypeSummary>> GetWorkItemTypesAsync(TfsSessionCredential credential, string projectId, string? collectionOverride, CancellationToken cancellationToken)
    {
        var collection = ValidateCollection(string.IsNullOrWhiteSpace(collectionOverride) ? options.Collection : collectionOverride);
        var project = ValidateProjectId(projectId);
        using var client = CreateClient(credential);
        var response = await SendAsync(client, collection + "/" + Uri.EscapeDataString(project) + "/_apis/wit/workitemtypes?api-version=1.0", cancellationToken, "work item types");
        var payload = await response.Content.ReadFromJsonAsync<TfsListResponse<TfsWorkItemTypeDto>>(cancellationToken: cancellationToken) ?? new TfsListResponse<TfsWorkItemTypeDto>();
        var result = new List<TfsWorkItemTypeSummary>();
        foreach (var type in payload.Value.Where(type => !string.IsNullOrWhiteSpace(type.Name)))
        {
            var detail = type;
            if (detail.States is null or { Count: 0 })
            {
                try { detail = await GetWorkItemTypePayloadAsync(client, collection, project, type.ReferenceName ?? type.Name!, cancellationToken); }
                catch (TfsProjectException) { /* Some TFS versions expose only the type list. */ }
            }
            result.Add(new TfsWorkItemTypeSummary(type.Name!, type.ReferenceName, type.Description, type.Url, detail.States?.Where(state => !string.IsNullOrWhiteSpace(state.Name)).Select(state => state.Name!).ToArray() ?? []));
        }
        return result;
    }

    public async Task<TfsWorkItemQueryResult> GetWorkItemsAsync(TfsSessionCredential credential, string projectId, string? collectionOverride, string? projectName, int limit, int offset, CancellationToken cancellationToken)
    {
        var collection = ValidateCollection(string.IsNullOrWhiteSpace(collectionOverride) ? options.Collection : collectionOverride);
        var project = ValidateProjectId(projectId);
        var requestedLimit = Math.Clamp(limit <= 0 ? 100 : limit, 1, 200);
        using var client = CreateClient(credential);
        var projectClause = string.IsNullOrWhiteSpace(projectName) ? "@project" : "'" + projectName.Trim().Replace("'", "''") + "'";
        var wiql = "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = " + projectClause + " AND [System.State] <> 'Removed' ORDER BY [System.Id] ASC";
        var queryResponse = await SendPostAsync(client, collection + "/" + Uri.EscapeDataString(project) + "/_apis/wit/wiql?api-version=1.0", new { query = wiql }, cancellationToken, "WIQL");
        var query = await queryResponse.Content.ReadFromJsonAsync<TfsWiqlResponse>(cancellationToken: cancellationToken) ?? new TfsWiqlResponse();
        var ids = query.WorkItems.Select(item => item.Id).Where(id => id > 0).Skip(Math.Max(0, offset)).Take(requestedLimit).ToArray();
        var items = new List<TfsWorkItemSummary>();
        for (var index = 0; index < ids.Length; index += 100)
        {
            var batch = string.Join(',', ids.Skip(index).Take(100));
            var response = await SendAsync(client, collection + "/_apis/wit/workitems?ids=" + batch + "&%24expand=relations&api-version=1.0", cancellationToken, "work item batch");
            var payload = await response.Content.ReadFromJsonAsync<TfsListResponse<TfsWorkItemDto>>(cancellationToken: cancellationToken) ?? new TfsListResponse<TfsWorkItemDto>();
            items.AddRange(payload.Value.Select(MapWorkItem));
        }
        return new TfsWorkItemQueryResult(collection, project, query.WorkItems.Count, items);
    }

    public async Task<TfsWorkItemDetail?> GetWorkItemAsync(TfsSessionCredential credential, string projectId, int workItemId, string? collectionOverride, CancellationToken cancellationToken)
    {
        if (workItemId <= 0) throw new TfsProjectException("Work item id is invalid.", "TFS_WORK_ITEM_ID_INVALID", StatusCodes.Status400BadRequest);
        var collection = ValidateCollection(string.IsNullOrWhiteSpace(collectionOverride) ? options.Collection : collectionOverride);
        using var client = CreateClient(credential);
        var response = await SendAsync(client, collection + "/_apis/wit/workitems/" + workItemId + "?%24expand=relations&api-version=1.0", cancellationToken, "work item detail", allowNotFound: true);
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        var item = await response.Content.ReadFromJsonAsync<TfsWorkItemDto>(cancellationToken: cancellationToken);
        return item is null ? null : MapWorkItemDetail(item);
    }

    public async Task<TfsWorkItemDetail> CreateWorkItemAsync(TfsSessionCredential credential, string projectId, string? collectionOverride, TfsCreateWorkItemRequest request, CancellationToken cancellationToken)
    {
        if (!options.WriteEnabled)
            throw new TfsProjectException("TFS task creation is disabled.", "TFS_WRITE_DISABLED", StatusCodes.Status403Forbidden);
        var project = ValidateProjectId(projectId);
        var collection = ValidateCollection(string.IsNullOrWhiteSpace(collectionOverride) ? options.Collection : collectionOverride);
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new TfsProjectException("Work item title is required.", "TFS_WORK_ITEM_TITLE_REQUIRED", StatusCodes.Status400BadRequest);
        var workItemType = ValidateWorkItemType(request.WorkItemType);
        var operations = new List<object>
        {
            new { op = "add", path = "/fields/System.Title", value = request.Title.Trim() }
        };
        AddFieldOperation(operations, "/fields/System.Description", request.Description);
        AddFieldOperation(operations, "/fields/System.AssignedTo", request.AssignedTo);
        AddFieldOperation(operations, "/fields/System.IterationPath", request.IterationPath);
        AddFieldOperation(operations, "/fields/Microsoft.VSTS.Scheduling.StartDate", request.StartDate);
        AddFieldOperation(operations, "/fields/Microsoft.VSTS.Scheduling.FinishDate", request.FinishDate);
        AddFieldOperation(operations, "/fields/System.Tags", CombineTags(request.Product, request.Tags));
        if (request.Priority is >= 1 and <= 4)
            operations.Add(new { op = "add", path = "/fields/Microsoft.VSTS.Common.Priority", value = request.Priority.Value });
        if (request.Effort is >= 0 && string.Equals(workItemType, "Task", StringComparison.OrdinalIgnoreCase))
            operations.Add(new { op = "add", path = "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate", value = request.Effort.Value });
        if (request.Progress is >= 0 and <= 100 && request.Effort is > 0 && string.Equals(workItemType, "Task", StringComparison.OrdinalIgnoreCase))
            AddProgressOperations(operations, request.Effort.Value, request.Progress.Value);
        if (request.ParentId is > 0)
        {
            operations.Add(new
            {
                op = "add",
                path = "/relations/-",
                value = new { rel = "System.LinkTypes.Hierarchy-Reverse", url = WorkItemUrl(collection, request.ParentId.Value) }
            });
        }
        AddDependencyOperations(operations, collection, request.Dependencies);

        using var client = CreateClient(credential);
        var response = await SendJsonPatchAsync(client, HttpMethod.Post, collection + "/" + Uri.EscapeDataString(project) + "/_apis/wit/workitems/$" + Uri.EscapeDataString(workItemType) + "?%24expand=all&api-version=1.0", operations, cancellationToken, "work item create");
        var item = await response.Content.ReadFromJsonAsync<TfsWorkItemDto>(cancellationToken: cancellationToken)
            ?? throw new TfsProjectException("TFS returned an empty work item response.", "TFS_WORK_ITEM_RESPONSE_EMPTY", StatusCodes.Status502BadGateway);
        if (!string.IsNullOrWhiteSpace(request.State) && !string.Equals(Field(item.Fields, "System.State"), request.State.Trim(), StringComparison.OrdinalIgnoreCase))
            item = await ApplyStatePathAsync(client, collection, project, item, request.State.Trim(), cancellationToken);
        return MapWorkItemDetail(item);
    }

    public async Task<TfsWorkItemDetail> UpdateWorkItemAsync(TfsSessionCredential credential, string projectId, int workItemId, string? collectionOverride, TfsUpdateWorkItemRequest request, CancellationToken cancellationToken)
    {
        if (!options.WriteEnabled)
            throw new TfsProjectException("TFS task update is disabled.", "TFS_WRITE_DISABLED", StatusCodes.Status403Forbidden);
        var project = ValidateProjectId(projectId);
        var collection = ValidateCollection(string.IsNullOrWhiteSpace(collectionOverride) ? options.Collection : collectionOverride);
        if (workItemId <= 0 || request.Revision <= 0)
            throw new TfsProjectException("Work item id and revision are required.", "TFS_WORK_ITEM_REVISION_INVALID", StatusCodes.Status400BadRequest);
        if (!string.IsNullOrWhiteSpace(request.Title) && request.Title.Trim().Length > 250)
            throw new TfsProjectException("Work item title is too long.", "TFS_WORK_ITEM_TITLE_INVALID", StatusCodes.Status400BadRequest);
        var operations = new List<object>();
        AddFieldOperation(operations, "/fields/System.Title", request.Title);
        AddFieldOrClearOperation(operations, "/fields/System.Description", request.Description);
        AddFieldOrClearOperation(operations, "/fields/System.AssignedTo", request.AssignedTo);
        AddFieldOrClearOperation(operations, "/fields/System.IterationPath", request.IterationPath);
        AddFieldOrClearOperation(operations, "/fields/Microsoft.VSTS.Scheduling.StartDate", request.StartDate);
        AddFieldOrClearOperation(operations, "/fields/Microsoft.VSTS.Scheduling.FinishDate", request.FinishDate);
        if (request.Product is not null || request.Tags is not null)
            AddFieldOrClearOperation(operations, "/fields/System.Tags", CombineTags(request.Product, request.Tags));
        if (request.Priority is >= 1 and <= 4)
            operations.Add(new { op = "replace", path = "/fields/Microsoft.VSTS.Common.Priority", value = request.Priority.Value });
        if (request.Effort is >= 0)
            operations.Add(new { op = "add", path = "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate", value = request.Effort.Value });
        if (operations.Count == 0 && request.ParentId is null && request.Dependencies is null)
            throw new TfsProjectException("At least one work item field is required.", "TFS_WORK_ITEM_UPDATE_EMPTY", StatusCodes.Status400BadRequest);
        using var client = CreateClient(credential);
        var currentItem = await GetWorkItemPayloadAsync(client, collection, workItemId, cancellationToken);
        var statePath = Array.Empty<string>();
        if (!string.IsNullOrWhiteSpace(request.State) && !string.Equals(Field(currentItem.Fields, "System.State"), request.State.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            statePath = await FindStatePathAsync(client, collection, project, currentItem, request.State.Trim(), cancellationToken);
            if (statePath.Length > 1)
                operations.Add(new { op = "add", path = "/fields/System.State", value = statePath[1] });
        }
        if (request.Progress is >= 0 and <= 100)
            AddProgressOperations(operations, currentItem.Fields, request.Progress.Value);
        var relationRemovals = new List<int>();
        if (request.ParentId is > 0)
        {
            // A repeated edit must not append a second hierarchy link. Remove
            // the current parent relation first, then add the selected parent.
            var currentParentRelation = RelationIndex(currentItem, "System.LinkTypes.Hierarchy-Reverse");
            if (currentParentRelation is not null) relationRemovals.Add(currentParentRelation.Value);
        }
        else
        {
            // The edit form sends null when the user selects “Không có”.
            // Remove the existing hierarchy link instead of leaving a stale
            // parent visible after the next reload.
            var currentParentRelation = RelationIndex(currentItem, "System.LinkTypes.Hierarchy-Reverse");
            if (currentParentRelation is not null) relationRemovals.Add(currentParentRelation.Value);
        }
        if (request.Dependencies is not null)
        {
            for (var index = 0; index < (currentItem.Relations?.Count ?? 0); index++)
            {
                if (string.Equals(currentItem.Relations![index].Relation, "System.LinkTypes.Dependency-Predecessor", StringComparison.OrdinalIgnoreCase))
                    relationRemovals.Add(index);
            }
        }
        foreach (var relationIndex in relationRemovals.Distinct().OrderDescending())
            operations.Add(new { op = "remove", path = "/relations/" + relationIndex });
        if (request.ParentId is > 0)
            operations.Add(new { op = "add", path = "/relations/-", value = new { rel = "System.LinkTypes.Hierarchy-Reverse", url = WorkItemUrl(collection, request.ParentId.Value) } });
        AddDependencyOperations(operations, collection, request.Dependencies);
        if (operations.Count == 0)
            throw new TfsProjectException("At least one work item field is required.", "TFS_WORK_ITEM_UPDATE_EMPTY", StatusCodes.Status400BadRequest);
        var response = await SendJsonPatchAsync(client, HttpMethod.Patch, collection + "/_apis/wit/workitems/" + workItemId + "?%24expand=all&api-version=1.0", operations, cancellationToken, "work item update", request.Revision.ToString());
        var item = await response.Content.ReadFromJsonAsync<TfsWorkItemDto>(cancellationToken: cancellationToken)
            ?? throw new TfsProjectException("TFS returned an empty work item response.", "TFS_WORK_ITEM_RESPONSE_EMPTY", StatusCodes.Status502BadGateway);
        for (var index = 2; index < statePath.Length; index++)
        {
            response = await SendJsonPatchAsync(client, HttpMethod.Patch, collection + "/_apis/wit/workitems/" + workItemId + "?%24expand=all&api-version=1.0", new List<object> { new { op = "add", path = "/fields/System.State", value = statePath[index] } }, cancellationToken, "work item state transition", item.Revision.ToString());
            item = await response.Content.ReadFromJsonAsync<TfsWorkItemDto>(cancellationToken: cancellationToken)
                ?? throw new TfsProjectException("TFS returned an empty work item response.", "TFS_WORK_ITEM_RESPONSE_EMPTY", StatusCodes.Status502BadGateway);
        }
        return MapWorkItemDetail(item);
    }

    public async Task<TfsWorkItemDetail> RemoveWorkItemAsync(TfsSessionCredential credential, string projectId, int workItemId, string? collectionOverride, int revision, CancellationToken cancellationToken)
    {
        if (!options.WriteEnabled)
            throw new TfsProjectException("TFS task removal is disabled.", "TFS_WRITE_DISABLED", StatusCodes.Status403Forbidden);
        var project = ValidateProjectId(projectId);
        var collection = ValidateCollection(string.IsNullOrWhiteSpace(collectionOverride) ? options.Collection : collectionOverride);
        if (workItemId <= 0 || revision <= 0)
            throw new TfsProjectException("Work item id and revision are required.", "TFS_WORK_ITEM_REVISION_INVALID", StatusCodes.Status400BadRequest);

        // Mirror Jarvis DELETE semantics: mark the TFS work item Removed with
        // a revision guard instead of hard-deleting it. Jarvis also soft-deletes
        // the local row, but this target route never writes Jarvis DB.
        var operations = new List<object>
        {
            // Match Jarvis' state update payload. TFS accepts an add operation
            // for an existing field and uses its workflow to validate Removed.
            new { op = "add", path = "/fields/System.State", value = "Removed" }
        };
        using var client = CreateClient(credential);
        var response = await SendJsonPatchAsync(client, HttpMethod.Patch, collection + "/_apis/wit/workitems/" + workItemId + "?%24expand=all&api-version=1.0", operations, cancellationToken, "work item remove", revision.ToString());
        var item = await response.Content.ReadFromJsonAsync<TfsWorkItemDto>(cancellationToken: cancellationToken);
        return item is null ? throw new TfsProjectException("TFS returned an empty work item response.", "TFS_WORK_ITEM_RESPONSE_EMPTY", StatusCodes.Status502BadGateway) : MapWorkItemDetail(item);
    }

    private async Task<IReadOnlyList<string>> GetCollectionsAsync(HttpClient client, CancellationToken cancellationToken)
    {
        var response = await SendAsync(client, "_apis/connectionData?connectOptions=1&lastChangeId=-1&lastChangeId64=-1", cancellationToken);
        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
        var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (document.RootElement.TryGetProperty("locationServiceData", out var locationData)
            && locationData.TryGetProperty("serviceDefinitions", out var definitions)
            && definitions.ValueKind == JsonValueKind.Array)
        {
            foreach (var definition in definitions.EnumerateArray())
            {
                if (!definition.TryGetProperty("serviceType", out var serviceType) || !string.Equals(serviceType.GetString(), "LocationService2", StringComparison.OrdinalIgnoreCase)) continue;
                if (!definition.TryGetProperty("locationMappings", out var mappings)) continue;
                IEnumerable<JsonElement> entries = mappings.ValueKind == JsonValueKind.Array ? mappings.EnumerateArray() : new[] { mappings };
                foreach (var mapping in entries)
                {
                    if (!mapping.TryGetProperty("location", out var location)) continue;
                    var value = location.GetString() ?? string.Empty;
                    var marker = value.IndexOf("/tfs/", StringComparison.OrdinalIgnoreCase);
                    if (marker < 0) continue;
                    var collection = value[(marker + 5)..].Trim('/');
                    if (!string.IsNullOrWhiteSpace(collection)) names.Add(Uri.UnescapeDataString(collection));
                }
            }
        }
        if (names.Count == 0 && !string.IsNullOrWhiteSpace(options.Collection)) names.Add(options.Collection);
        if (names.Count == 0) throw new TfsProjectException("No TFS collection is visible to this account.", "TFS_COLLECTION_NOT_FOUND", StatusCodes.Status503ServiceUnavailable);
        return names.OrderBy(value => value, StringComparer.OrdinalIgnoreCase).ToArray();
    }

    private async Task<TfsWorkItemDto> GetWorkItemPayloadAsync(HttpClient client, string collection, int workItemId, CancellationToken cancellationToken)
    {
        var response = await SendAsync(client, collection + "/_apis/wit/workitems/" + workItemId + "?%24expand=relations&api-version=1.0", cancellationToken, "work item parent");
        return await response.Content.ReadFromJsonAsync<TfsWorkItemDto>(cancellationToken: cancellationToken)
            ?? throw new TfsProjectException("TFS returned an empty work item response.", "TFS_WORK_ITEM_RESPONSE_EMPTY", StatusCodes.Status502BadGateway);
    }

    private async Task<TfsWorkItemTypeDto> GetWorkItemTypePayloadAsync(HttpClient client, string collection, string project, string workItemType, CancellationToken cancellationToken)
    {
        var response = await SendAsync(client, collection + "/" + Uri.EscapeDataString(project) + "/_apis/wit/workitemtypes/" + Uri.EscapeDataString(workItemType) + "?api-version=1.0", cancellationToken, "work item type");
        return await response.Content.ReadFromJsonAsync<TfsWorkItemTypeDto>(cancellationToken: cancellationToken)
            ?? throw new TfsProjectException("TFS returned an empty work item type response.", "TFS_WORK_ITEM_TYPE_RESPONSE_EMPTY", StatusCodes.Status502BadGateway);
    }

    private async Task<string[]> FindStatePathAsync(HttpClient client, string collection, string project, TfsWorkItemDto item, string targetState, CancellationToken cancellationToken)
    {
        var currentState = Field(item.Fields, "System.State") ?? string.Empty;
        var workItemType = Field(item.Fields, "System.WorkItemType") ?? "Task";
        var type = await GetWorkItemTypePayloadAsync(client, collection, project, workItemType, cancellationToken);
        var transitions = type.Transitions ?? new Dictionary<string, List<TfsWorkItemTransitionDto>>(StringComparer.OrdinalIgnoreCase);
        var queue = new Queue<string[]>();
        var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { currentState };
        queue.Enqueue([currentState]);
        while (queue.Count > 0)
        {
            var path = queue.Dequeue();
            var current = path[^1];
            if (string.Equals(current, targetState, StringComparison.OrdinalIgnoreCase)) return path;
            if (!transitions.TryGetValue(current, out var nextStates))
            {
                var matchingTransition = transitions.FirstOrDefault(entry => string.Equals(entry.Key, current, StringComparison.OrdinalIgnoreCase));
                nextStates = matchingTransition.Value;
            }
            if (nextStates is null) continue;
            foreach (var nextState in nextStates.Select(state => state.To).Where(state => !string.IsNullOrWhiteSpace(state)))
            {
                if (visited.Add(nextState!)) queue.Enqueue([.. path, nextState!]);
            }
        }
        throw new TfsProjectException($"TFS không có transition {currentState} → {targetState} cho {workItemType}.", "TFS_STATE_TRANSITION_UNAVAILABLE", StatusCodes.Status400BadRequest);
    }

    private async Task<TfsWorkItemDto> ApplyStatePathAsync(HttpClient client, string collection, string project, TfsWorkItemDto item, string targetState, CancellationToken cancellationToken)
    {
        var path = await FindStatePathAsync(client, collection, project, item, targetState, cancellationToken);
        for (var index = 1; index < path.Length; index++)
        {
            var response = await SendJsonPatchAsync(client, HttpMethod.Patch, collection + "/_apis/wit/workitems/" + item.Id + "?%24expand=all&api-version=1.0", new List<object> { new { op = "add", path = "/fields/System.State", value = path[index] } }, cancellationToken, "work item state transition", item.Revision.ToString());
            item = await response.Content.ReadFromJsonAsync<TfsWorkItemDto>(cancellationToken: cancellationToken)
                ?? throw new TfsProjectException("TFS returned an empty work item response.", "TFS_WORK_ITEM_RESPONSE_EMPTY", StatusCodes.Status502BadGateway);
        }
        return item;
    }

    private static int? RelationIndex(TfsWorkItemDto item, string relation)
    {
        if (item.Relations is null) return null;
        for (var index = 0; index < item.Relations.Count; index++)
        {
            if (string.Equals(item.Relations[index].Relation, relation, StringComparison.OrdinalIgnoreCase)) return index;
        }
        return null;
    }

    private void AddDependencyOperations(List<object> operations, string collection, IReadOnlyList<TfsWorkItemDependencyRequest>? dependencies)
    {
        if (dependencies is null) return;
        foreach (var dependency in dependencies.Where(item => item.PredecessorId > 0))
        {
            operations.Add(new
            {
                op = "add",
                path = "/relations/-",
                value = new { rel = "System.LinkTypes.Dependency-Predecessor", url = WorkItemUrl(collection, dependency.PredecessorId) }
            });
        }
    }

    private static void AddProgressOperations(List<object> operations, decimal effort, decimal progress)
    {
        var completed = Math.Round(effort * Math.Clamp(progress, 0, 100) / 100, 2);
        var remaining = Math.Max(0, Math.Round(effort - completed, 2));
        operations.Add(new { op = "add", path = "/fields/Microsoft.VSTS.Scheduling.CompletedWork", value = completed });
        operations.Add(new { op = "add", path = "/fields/Microsoft.VSTS.Scheduling.RemainingWork", value = remaining });
    }

    private static void AddProgressOperations(List<object> operations, Dictionary<string, JsonElement>? fields, decimal progress)
    {
        var completed = DecimalField(fields, "Microsoft.VSTS.Scheduling.CompletedWork");
        var remaining = DecimalField(fields, "Microsoft.VSTS.Scheduling.RemainingWork");
        if (completed is null || remaining is null || completed + remaining <= 0) return;
        AddProgressOperations(operations, completed.Value + remaining.Value, progress);
    }

    private async Task<HttpResponseMessage> SendAsync(HttpClient client, string relativeUrl, CancellationToken cancellationToken, string operation = "project API", bool allowNotFound = false)
    {
        try
        {
            return EnsureResponse(await client.GetAsync(relativeUrl, cancellationToken), operation, allowNotFound);
        }
        catch (TfsProjectException) { throw; }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new TfsProjectException("TFS project request timed out.", "TFS_PROJECTS_TIMEOUT", StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException)
        {
            throw new TfsProjectException("TFS project service is unavailable.", "TFS_PROJECTS_UNAVAILABLE", StatusCodes.Status503ServiceUnavailable);
        }
    }

    private HttpClient CreateClient(TfsSessionCredential credential)
    {
        if (!options.Enabled || string.IsNullOrWhiteSpace(options.BaseUrl))
            throw new TfsProjectException("TFS authentication is not configured.", "TFS_DISABLED", StatusCodes.Status503ServiceUnavailable);
        if (!Uri.TryCreate(options.BaseUrl.TrimEnd('/') + "/", UriKind.Absolute, out var baseUri) || (baseUri.Scheme != Uri.UriSchemeHttp && baseUri.Scheme != Uri.UriSchemeHttps))
            throw new TfsProjectException("TFS base URL must be an absolute HTTP or HTTPS URL.", "TFS_URL_INVALID", StatusCodes.Status503ServiceUnavailable);
        var credentials = new CredentialCache();
        credentials.Add(baseUri, "NTLM", new NetworkCredential(credential.Username, credential.Password, credential.Domain));
        var handler = new HttpClientHandler { Credentials = credentials, PreAuthenticate = false, UseCookies = false, UseProxy = false, AllowAutoRedirect = false, AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate };
        var client = new HttpClient(handler) { BaseAddress = baseUri, Timeout = TimeSpan.FromSeconds(Math.Max(1, options.TimeoutSeconds)) };
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        client.DefaultRequestHeaders.UserAgent.ParseAdd("FiinGroupApp-TFS-Project/1.0");
        return client;
    }

    private static string ValidateCollection(string? collection)
    {
        var value = (collection ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(value) || value.Contains('/') || value.Contains('\\'))
            throw new TfsProjectException("TFS collection is invalid.", "TFS_COLLECTION_INVALID", StatusCodes.Status400BadRequest);
        return Uri.EscapeDataString(value);
    }

    private static string ValidateProjectId(string projectId)
    {
        if (string.IsNullOrWhiteSpace(projectId)) throw new TfsProjectException("Project id is required.", "TFS_PROJECT_ID_REQUIRED", StatusCodes.Status400BadRequest);
        return projectId.Trim();
    }

    private static string ValidateWorkItemType(string? workItemType)
    {
        var value = string.IsNullOrWhiteSpace(workItemType) ? "Task" : workItemType.Trim();
        if (value.Length > 50 || value.Any(character => !(char.IsLetterOrDigit(character) || character is ' ' or '-' or '_')))
            throw new TfsProjectException("Work item type is invalid.", "TFS_WORK_ITEM_TYPE_INVALID", StatusCodes.Status400BadRequest);
        return value;
    }

    private static void AddFieldOperation(List<object> operations, string path, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value)) operations.Add(new { op = "add", path, value = value.Trim() });
    }

    private static void AddFieldOrClearOperation(List<object> operations, string path, string? value)
    {
        if (value is not null) operations.Add(new { op = "add", path, value = string.IsNullOrWhiteSpace(value) ? (string?)null : value.Trim() });
    }

    private static string? CombineTags(string? product, string? tags)
    {
        var values = new[] { product, tags }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .SelectMany(value => value!.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        return values.Length == 0 ? null : string.Join("; ", values);
    }

    private string WorkItemUrl(string collection, int id)
        => options.BaseUrl!.TrimEnd('/') + "/" + collection + "/_apis/wit/workitems/" + id;

    private static TfsProjectSummary Map(string collection, TfsProjectDto project) => new(collection, project.Id ?? string.Empty, project.Name ?? string.Empty, project.Description, project.State, project.Url);
    private static TfsWorkItemSummary MapWorkItem(TfsWorkItemDto item)
    {
        var statusCode = MapStatus(Field(item.Fields, "System.State"));
        var startDate = MappedStartDate(item.Fields);
        var endDate = MappedEndDate(item.Fields);
        var progress = CalculateProgress(item.Fields, statusCode);
        return new(item.Id, item.Revision, Field(item.Fields, "System.Title"), Field(item.Fields, "System.WorkItemType"), Field(item.Fields, "System.State"), Field(item.Fields, "System.AssignedTo"), Field(item.Fields, "System.IterationPath"), IntegerField(item.Fields, "System.Parent"), startDate, endDate, Field(item.Fields, "Microsoft.VSTS.Scheduling.TargetDate"), Field(item.Fields, "Microsoft.VSTS.Common.ClosedDate"), statusCode, progress, CalculatePlan(startDate, endDate, progress), MapPriority(IntegerField(item.Fields, "Microsoft.VSTS.Common.Priority")), "TFS-" + item.Id, Field(item.Fields, "System.Tags") ?? Field(item.Fields, "System.AreaPath"), CreatedByLogin(Field(item.Fields, "System.CreatedBy")), item.Url, DecimalField(item.Fields, "Microsoft.VSTS.Scheduling.OriginalEstimate"), PredecessorIds(item), GeneratedFields(item.Fields));
    }

    private static TfsWorkItemDetail MapWorkItemDetail(TfsWorkItemDto item)
    {
        var statusCode = MapStatus(Field(item.Fields, "System.State"));
        var startDate = MappedStartDate(item.Fields);
        var endDate = MappedEndDate(item.Fields);
        var progress = CalculateProgress(item.Fields, statusCode);
        return new(item.Id, item.Revision, Field(item.Fields, "System.Title"), Field(item.Fields, "System.WorkItemType"), Field(item.Fields, "System.State"), Field(item.Fields, "System.AssignedTo"), Field(item.Fields, "System.IterationPath"), IntegerField(item.Fields, "System.Parent"), Field(item.Fields, "System.Description"), Field(item.Fields, "System.CreatedDate"), Field(item.Fields, "System.ChangedDate"), startDate, Field(item.Fields, "Microsoft.VSTS.Scheduling.FinishDate"), Field(item.Fields, "Microsoft.VSTS.Scheduling.TargetDate"), Field(item.Fields, "Microsoft.VSTS.Common.Priority"), Field(item.Fields, "System.Tags"), Field(item.Fields, "System.History"), statusCode, progress, CalculatePlan(startDate, endDate, progress), MapPriority(IntegerField(item.Fields, "Microsoft.VSTS.Common.Priority")), "TFS-" + item.Id, Field(item.Fields, "System.Tags") ?? Field(item.Fields, "System.AreaPath"), CreatedByLogin(Field(item.Fields, "System.CreatedBy")), item.Url, DecimalField(item.Fields, "Microsoft.VSTS.Scheduling.OriginalEstimate"), PredecessorIds(item), GeneratedFields(item.Fields));
    }

    private static IReadOnlyDictionary<string, string> GeneratedFields(Dictionary<string, JsonElement>? fields)
    {
        var generated = new Dictionary<string, string>(StringComparer.Ordinal);
        if (Field(fields, "Microsoft.VSTS.Scheduling.StartDate") is null)
            generated["startDate"] = "Fallback từ System.CreatedDate; không phải ngày kế hoạch TFS";
        if (Field(fields, "Microsoft.VSTS.Scheduling.FinishDate") is null && Field(fields, "Microsoft.VSTS.Scheduling.TargetDate") is null)
            generated["finishDate"] = "Fallback từ System.ChangedDate/ClosedDate; không phải ngày kết thúc kế hoạch TFS";
        if (DecimalField(fields, "Microsoft.VSTS.Scheduling.CompletedWork") is null || DecimalField(fields, "Microsoft.VSTS.Scheduling.RemainingWork") is null)
            generated["progress"] = "Suy ra từ System.State vì TFS không có CompletedWork/RemainingWork";
        generated["plan"] = "TFS không có field % kế hoạch tương đương trực tiếp";
        return generated;
    }

    private static int MapStatus(string? state)
    {
        var value = (state ?? string.Empty).Trim().ToLowerInvariant();
        if (value.Contains("done") || value.Contains("closed") || value.Contains("completed") || value.Contains("complete") || value.Contains("accepted") || value.Contains("inactive")) return 3;
        if (value.Contains("removed") || value.Contains("deleted") || value.Contains("cancel") || value.Contains("cut")) return 9;
        if (value.Contains("blocked") || value.Contains("paused") || value.Contains("resolved") || value.Contains("on hold")) return 2;
        if (value.Contains("active") || value.Contains("doing") || value.Contains("in progress") || value.Contains("committed") || value.Contains("commited") || value.Contains("development") || value.Contains("testing") || value.Contains("review") || value.Contains("deployment") || value.Contains("deployed") || value.Contains("open") || value.Contains("ready")) return 1;
        return 0;
    }

    private static decimal CalculateProgress(Dictionary<string, JsonElement>? fields, int status)
    {
        var completed = DecimalField(fields, "Microsoft.VSTS.Scheduling.CompletedWork");
        var remaining = DecimalField(fields, "Microsoft.VSTS.Scheduling.RemainingWork");
        if (completed is >= 0 && remaining is >= 0 && completed + remaining > 0)
            return Math.Clamp(decimal.Round(completed.Value * 100 / (completed.Value + remaining.Value), 2), 0, 100);
        return status == 3 ? 100 : status is 1 or 2 ? 50 : 0;
    }

    private static decimal CalculatePlan(string? startDate, string? endDate, decimal progress)
    {
        if (!DateTimeOffset.TryParse(startDate, out var start) || !DateTimeOffset.TryParse(endDate, out var end)) return progress;
        var now = DateTimeOffset.UtcNow;
        var startOfDay = new DateTimeOffset(start.UtcDateTime.Date, TimeSpan.Zero);
        var endOfDay = new DateTimeOffset(end.UtcDateTime.Date.AddDays(1).AddTicks(-1), TimeSpan.Zero);
        if (now <= startOfDay) return 0;
        if (now >= endOfDay) return 100;
        return Math.Clamp(decimal.Round((decimal)((now - startOfDay).TotalMilliseconds / (endOfDay - startOfDay).TotalMilliseconds * 100), 2), 0, 100);
    }

    private static int MapPriority(int? priority) => priority switch { 1 => 4, 2 => 3, 3 => 2, >= 4 => 1, _ => 2 };

    private static string? CreatedByLogin(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "tfs-sync";
        var login = value.Trim();
        var slash = login.LastIndexOf('\\');
        return (slash >= 0 ? login[(slash + 1)..] : login).ToLowerInvariant();
    }

    private static string? MappedStartDate(Dictionary<string, JsonElement>? fields)
        => Field(fields, "Microsoft.VSTS.Scheduling.StartDate") ?? Field(fields, "System.CreatedDate");

    private static string? MappedEndDate(Dictionary<string, JsonElement>? fields)
        => Field(fields, "Microsoft.VSTS.Scheduling.FinishDate")
            ?? Field(fields, "Microsoft.VSTS.Scheduling.TargetDate")
            ?? Field(fields, "Microsoft.VSTS.Common.ClosedDate")
            ?? Field(fields, "System.ChangedDate")
            ?? MappedStartDate(fields);

    private static string? Field(Dictionary<string, JsonElement>? fields, string key)
    {
        if (fields is null || !fields.TryGetValue(key, out var value)) return null;
        if (value.ValueKind == JsonValueKind.Object && value.TryGetProperty("displayName", out var displayName)) return displayName.GetString();
        return value.ValueKind == JsonValueKind.String ? value.GetString() : value.ToString();
    }

    private static int? IntegerField(Dictionary<string, JsonElement>? fields, string key)
    {
        if (fields is null || !fields.TryGetValue(key, out var value)) return null;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var number)) return number;
        return int.TryParse(value.ToString(), out var parsed) ? parsed : null;
    }

    private static decimal? DecimalField(Dictionary<string, JsonElement>? fields, string key)
    {
        if (fields is null || !fields.TryGetValue(key, out var value)) return null;
        return decimal.TryParse(value.ToString(), out var parsed) ? parsed : null;
    }

    private static IReadOnlyList<int> PredecessorIds(TfsWorkItemDto item)
        => item.Relations?.Where(relation => string.Equals(relation.Relation, "System.LinkTypes.Dependency-Predecessor", StringComparison.OrdinalIgnoreCase))
            .Select(relation => RelationWorkItemId(relation.Url))
            .Where(id => id is not null)
            .Select(id => id!.Value)
            .ToArray() ?? [];

    private static int? RelationWorkItemId(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return null;
        var value = url.Split('?', 2)[0].TrimEnd('/');
        var slash = value.LastIndexOf('/');
        return slash >= 0 && int.TryParse(value[(slash + 1)..], out var id) ? id : null;
    }

    private async Task<HttpResponseMessage> SendPostAsync(HttpClient client, string relativeUrl, object body, CancellationToken cancellationToken, string operation)
    {
        try
        {
            var json = JsonSerializer.Serialize(body);
            using var content = new ByteArrayContent(Encoding.UTF8.GetBytes(json));
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            var response = await client.PostAsync(relativeUrl, content, cancellationToken);
            return EnsureResponse(response, operation);
        }
        catch (TfsProjectException) { throw; }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new TfsProjectException("TFS project request timed out.", "TFS_PROJECTS_TIMEOUT", StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException)
        {
            throw new TfsProjectException("TFS project service is unavailable.", "TFS_PROJECTS_UNAVAILABLE", StatusCodes.Status503ServiceUnavailable);
        }
    }

    private async Task<HttpResponseMessage> SendJsonPatchAsync(HttpClient client, HttpMethod method, string relativeUrl, object body, CancellationToken cancellationToken, string operation, string? ifMatch = null)
    {
        try
        {
            using var request = new HttpRequestMessage(method, relativeUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json-patch+json")
            };
            if (!string.IsNullOrWhiteSpace(ifMatch))
                request.Headers.TryAddWithoutValidation("If-Match", ifMatch);
            return EnsureResponse(await client.SendAsync(request, cancellationToken), operation);
        }
        catch (TfsProjectException) { throw; }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new TfsProjectException("TFS project request timed out.", "TFS_PROJECTS_TIMEOUT", StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException)
        {
            throw new TfsProjectException("TFS project service is unavailable.", "TFS_PROJECTS_UNAVAILABLE", StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static HttpResponseMessage EnsureResponse(HttpResponseMessage response, string operation, bool allowNotFound = false)
    {
        if (allowNotFound && response.StatusCode == HttpStatusCode.NotFound)
            return response;
        if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
            throw new TfsProjectException("TFS denied access to the " + operation + " request.", "TFS_PROJECTS_FORBIDDEN", StatusCodes.Status403Forbidden);
        if (response.StatusCode == HttpStatusCode.NotFound)
            throw new TfsProjectException("TFS " + operation + " endpoint was not found.", "TFS_PROJECTS_ENDPOINT_NOT_FOUND", StatusCodes.Status503ServiceUnavailable);
        if (!response.IsSuccessStatusCode)
        {
            var code = operation == "WIQL" ? "TFS_WIQL_HTTP_ERROR" : operation == "work item batch" ? "TFS_WORK_ITEMS_HTTP_ERROR" : operation == "work item create" ? "TFS_WORK_ITEM_CREATE_HTTP_ERROR" : operation == "work item remove" ? "TFS_WORK_ITEM_REMOVE_HTTP_ERROR" : "TFS_PROJECTS_HTTP_ERROR";
            var statusCode = (int)response.StatusCode is >= 400 and < 500
                ? (int)response.StatusCode
                : StatusCodes.Status503ServiceUnavailable;
            throw new TfsProjectException("TFS returned HTTP " + (int)response.StatusCode + " for the " + operation + " request.", code, statusCode);
        }
        return response;
    }

    private sealed class TfsListResponse<T> { [JsonPropertyName("value")] public List<T> Value { get; init; } = []; }
    private sealed class TfsProjectDto
    {
        [JsonPropertyName("id")] public string? Id { get; init; }
        [JsonPropertyName("name")] public string? Name { get; init; }
        [JsonPropertyName("description")] public string? Description { get; init; }
        [JsonPropertyName("state")] public string? State { get; init; }
        [JsonPropertyName("url")] public string? Url { get; init; }
    }
    private sealed class TfsTeamDto { [JsonPropertyName("id")] public string? Id { get; init; } [JsonPropertyName("name")] public string? Name { get; init; } [JsonPropertyName("description")] public string? Description { get; init; } [JsonPropertyName("url")] public string? Url { get; init; } }
    private sealed class TfsIterationDto { [JsonPropertyName("id")] public string? Id { get; init; } [JsonPropertyName("name")] public string? Name { get; init; } [JsonPropertyName("path")] public string? Path { get; init; } [JsonPropertyName("url")] public string? Url { get; init; } [JsonPropertyName("attributes")] public TfsIterationAttributes? Attributes { get; init; } }
    private sealed class TfsIterationAttributes { [JsonPropertyName("timeFrame")] public string? TimeFrame { get; init; } }
    private sealed class TfsWorkItemTypeDto { [JsonPropertyName("name")] public string? Name { get; init; } [JsonPropertyName("referenceName")] public string? ReferenceName { get; init; } [JsonPropertyName("description")] public string? Description { get; init; } [JsonPropertyName("url")] public string? Url { get; init; } [JsonPropertyName("states")] public List<TfsWorkItemStateDto>? States { get; init; } [JsonPropertyName("transitions")] public Dictionary<string, List<TfsWorkItemTransitionDto>>? Transitions { get; init; } }
    private sealed class TfsWorkItemStateDto { [JsonPropertyName("name")] public string? Name { get; init; } }
    private sealed class TfsWorkItemTransitionDto { [JsonPropertyName("to")] public string? To { get; init; } }
    private sealed class TfsWiqlResponse { [JsonPropertyName("workItems")] public List<TfsWorkItemReference> WorkItems { get; init; } = []; }
    private sealed class TfsWorkItemReference { [JsonPropertyName("id")] public int Id { get; init; } }
    private sealed class TfsRelationDto { [JsonPropertyName("rel")] public string? Relation { get; init; } [JsonPropertyName("url")] public string? Url { get; init; } }
    private sealed class TfsWorkItemDto { [JsonPropertyName("id")] public int Id { get; init; } [JsonPropertyName("rev")] public int Revision { get; init; } [JsonPropertyName("url")] public string? Url { get; init; } [JsonPropertyName("fields")] public Dictionary<string, JsonElement>? Fields { get; init; } [JsonPropertyName("relations")] public List<TfsRelationDto>? Relations { get; init; } }
}

public sealed class TfsProjectException(string message, string code, int statusCode) : Exception(message)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
}
