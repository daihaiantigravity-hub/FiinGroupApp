import { useEffect, useState } from 'react';
import {
  getProjectManagementSummaryPage,
  type ProjectManagementProjectSummary,
  type ProjectManagementSummaryListItem,
} from './projectManagementClient';

type Props = {
  year: string;
  week: string;
  customer: string;
  projectManager: string;
  projectId: string;
  projects: ProjectManagementProjectSummary[];
};

function formatDate(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value.includes(' ') ? value.replace(' ', 'T') : `${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('vi-VN');
}

export default function TargetSummaryInheritancePreview({ year, week, customer, projectManager, projectId, projects }: Props) {
  const [rows, setRows] = useState<ProjectManagementSummaryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!year || !week) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const common = {
          year: Number(year),
          week: Number(week),
          customer: customer || undefined,
          projectManager: projectManager || undefined,
          projectId: projectId ? Number(projectId) : undefined,
          limit: 200,
          offset: 0,
        };
        const [materialized, baseline] = await Promise.all([
          getProjectManagementSummaryPage({ ...common, sectionType: 1 }),
          getProjectManagementSummaryPage({ ...common, sectionType: 2 }),
        ]);
        if (!active) return;
        const materializedProjects = new Set(materialized.rows.map(row => row.projectRecordId).filter((id): id is number => id !== null));
        const progressByProject = new Map(projects.map(item => [item.project.id, item.latestSummaryYear !== null ? item.latestActualPercent : item.averageProgress]));
        setRows(baseline.rows
          .filter(row => row.projectRecordId === null || !materializedProjects.has(row.projectRecordId))
          .map(row => ({
            ...row,
            inherited: true,
            summary: {
              ...row.summary,
              id: -Math.abs(row.summary.id),
              year: Number(year),
              week: Number(week),
              sectionType: 1,
              entryType: 0,
              actualPercent: progressByProject.get(row.projectRecordId ?? -1) ?? 0,
            },
          })));
      } catch (exception) {
        if (active) setError(exception instanceof Error ? exception.message : 'Không tải được preview kế thừa.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [customer, projectId, projectManager, projects, week, year]);

  if (!year || !week) return <section className="target-summary-inheritance-preview"><span>Chọn năm và tuần để kiểm tra preview kế thừa của Summary.</span></section>;
  if (loading) return <section className="target-summary-inheritance-preview"><span>Đang kiểm tra dòng kế hoạch có thể kế thừa…</span></section>;
  if (error) return <section className="target-summary-inheritance-preview"><p className="error">{error}</p></section>;

  return <section className="platform-card target-summary-inheritance-preview"><header><div><span className="card-label">Jarvis section_type=2 → section_type=1</span><h3>Preview Summary kế thừa</h3></div><span className="muted">{rows.length} dòng chưa vật hóa</span></header>{rows.length ? <div className="table-scroll-x"><table className="data-table target-summary-inheritance-table"><thead><tr><th>Project</th><th>Khách hàng / PM</th><th>Plan</th><th>Actual preview</th><th>Khoảng thời gian</th><th>Nguồn kế hoạch</th><th>Notes / resources</th></tr></thead><tbody>{rows.map(row => <tr key={`${row.summary.id}-${row.projectRecordId ?? row.summary.projectId}`}><td><strong>{row.projectCode || row.annexNo || row.annexName || `#${row.summary.projectId}`}</strong><small>{row.annexName || row.summary.annexName || '—'}</small></td><td><strong>{row.summary.customer || '—'}</strong><small>{row.summary.projectManager || row.projectManager || '—'}</small></td><td><strong>{Math.round(row.summary.planPercent)}%</strong></td><td><strong>{Math.round(row.summary.actualPercent)}%</strong></td><td>{formatDate(row.summary.startDate)}<small>→ {formatDate(row.summary.endDate)}</small></td><td><span className="target-task-plan-inherited-badge">Kế thừa từ #{Math.abs(row.summary.id)}</span></td><td className="target-summary-inheritance-notes">{row.summary.notes || '—'}<small>{row.summary.resources || 'Không có resource'}</small></td></tr>)}</tbody></table></div> : <div className="target-task-plan-week-empty">Không có dòng section_type=2 nào cần kế thừa; các project đã có progress hoặc chưa có kế hoạch tuần.</div>}<footer className="target-project-summary-footer"><span>Preview read-only; không tạo bản sao và không cập nhật pm_project_summary.</span></footer></section>;
}
