namespace FiinGroupApp.Api.ProjectManagement;

// Mirrors Jarvis GET /api/project-tasks/critical-path/:projectId.
// The source endpoint currently assumes every dependency is Finish-to-Start
// while calculating the forward/backward passes; keep that behavior here.
public static class CriticalPathCalculator
{
    public static ProjectManagementCriticalPath Calculate(
        IReadOnlyList<ProjectManagementTask> tasks,
        IReadOnlyList<ProjectManagementTaskDependency> dependencies)
    {
        var nodes = tasks.ToDictionary(task => task.Id, task => new Node(task));
        var successors = tasks.ToDictionary(task => task.Id, _ => new List<(int TaskId, int Lag)>());
        var predecessors = tasks.ToDictionary(task => task.Id, _ => new List<(int TaskId, int Lag)>());

        foreach (var dependency in dependencies)
        {
            if (successors.TryGetValue(dependency.DependsOnId, out var successorList))
                successorList.Add((dependency.TaskId, dependency.LagDays));
            if (predecessors.TryGetValue(dependency.TaskId, out var predecessorList))
                predecessorList.Add((dependency.DependsOnId, dependency.LagDays));
        }

        var visited = new HashSet<int>();
        var topologicalOrder = new List<int>();

        void Visit(int taskId)
        {
            if (!visited.Add(taskId)) return;
            foreach (var predecessor in predecessors[taskId]) Visit(predecessor.TaskId);
            topologicalOrder.Add(taskId);
        }

        foreach (var task in tasks) Visit(task.Id);

        foreach (var taskId in topologicalOrder)
        {
            var node = nodes[taskId];
            var maxEarlyFinish = 0;
            foreach (var predecessor in predecessors[taskId])
            {
                if (nodes.TryGetValue(predecessor.TaskId, out var predecessorNode))
                    maxEarlyFinish = Math.Max(maxEarlyFinish, predecessorNode.EarlyFinish + predecessor.Lag);
            }

            node.EarlyStart = maxEarlyFinish;
            node.EarlyFinish = node.EarlyStart + node.Duration;
        }

        var projectDuration = nodes.Values.Any() ? nodes.Values.Max(node => node.EarlyFinish) : 0;

        for (var index = topologicalOrder.Count - 1; index >= 0; index--)
        {
            var node = nodes[topologicalOrder[index]];
            if (successors[node.Task.Id].Count == 0)
            {
                node.LateFinish = projectDuration;
            }
            else
            {
                var minLateStart = int.MaxValue;
                foreach (var successor in successors[node.Task.Id])
                {
                    if (nodes.TryGetValue(successor.TaskId, out var successorNode))
                        minLateStart = Math.Min(minLateStart, successorNode.LateStart - successor.Lag);
                }
                node.LateFinish = minLateStart == int.MaxValue ? projectDuration : minLateStart;
            }

            node.LateStart = node.LateFinish - node.Duration;
            node.Slack = node.LateStart - node.EarlyStart;
            node.IsCritical = node.Slack == 0;
        }

        var allTasks = tasks.Select(task => nodes[task.Id].ToContract()).ToList();
        return new ProjectManagementCriticalPath(
            projectDuration,
            allTasks.Where(task => task.IsCritical).ToList(),
            allTasks);
    }

    private sealed class Node(ProjectManagementTask task)
    {
        public ProjectManagementTask Task { get; } = task;
        public int Duration { get; } = task.Duration == 0 ? 1 : task.Duration;
        public int EarlyStart { get; set; }
        public int EarlyFinish { get; set; }
        public int LateStart { get; set; }
        public int LateFinish { get; set; }
        public int Slack { get; set; }
        public bool IsCritical { get; set; }

        public ProjectManagementCriticalPathTask ToContract() => new(
            Task.Id,
            Task.TaskCode,
            Task.TaskName,
            Duration,
            EarlyStart,
            EarlyFinish,
            LateStart,
            LateFinish,
            Slack,
            IsCritical);
    }
}
