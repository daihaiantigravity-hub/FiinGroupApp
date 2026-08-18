import { useEffect, useMemo, useRef } from 'react';
import type { ProjectManagementGantt, ProjectManagementGanttTask } from './projectManagementClient';

function parseDay(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const result = new Date(year, month - 1, day);
  return Number.isNaN(result.getTime()) ? null : result;
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

function dayLabel(value: Date) {
  return value.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

const ROW_HEIGHT = 45;
const CELL_WIDTH = 28;

function statusClass(task: ProjectManagementGanttTask) {
  if (task.status === 3 || task.progress >= 100) return 'done';
  const end = parseDay(task.endDate);
  if (end && end < new Date() && task.status !== 3) return 'overdue';
  return 'active';
}

export default function LocalProjectManagementGantt({ data, onSelectTask }: { data: ProjectManagementGantt; onSelectTask: (taskId: number) => void }) {
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const taskById = useMemo(() => new Map(data.tasks.map(task => [task.id, task])), [data.tasks]);
  const depthById = useMemo(() => {
    const parentById = new Map(data.tasks.map(task => [task.id, task.parentId]));
    const depth = (id: number, seen = new Set<number>()): number => {
      const parent = parentById.get(id);
      if (!parent || seen.has(id)) return 0;
      seen.add(id);
      return 1 + depth(parent, seen);
    };
    return new Map(data.tasks.map(task => [task.id, depth(task.id)]));
  }, [data.tasks]);
  const timeline = useMemo(() => {
    const starts = data.tasks.map(task => parseDay(task.startDate)).filter((value): value is Date => value !== null);
    const ends = data.tasks.map(task => parseDay(task.endDate)).filter((value): value is Date => value !== null);
    const today = new Date();
    const min = addDays(starts.length ? new Date(Math.min(...starts.map(value => value.getTime()))) : today, -7);
    const max = addDays(ends.length ? new Date(Math.max(...ends.map(value => value.getTime()))) : today, 14);
    const days = Array.from({ length: diffDays(min, max) + 1 }, (_, index) => addDays(min, index));
    const months: Array<{ key: string; label: string; width: number }> = [];
    days.forEach(day => {
      const key = `${day.getFullYear()}-${day.getMonth()}`;
      const current = months[months.length - 1];
      if (current?.key === key) {
        current.width += CELL_WIDTH;
      } else {
        months.push({ key, label: day.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }), width: CELL_WIDTH });
      }
    });
    return { min, max, days, months, width: days.length * CELL_WIDTH };
  }, [data.tasks]);

  const geometryById = useMemo(() => {
    const rows = new Map<number, { index: number; left: number; width: number }>();
    data.tasks.forEach((task, index) => {
      const start = parseDay(task.startDate);
      const end = parseDay(task.endDate);
      if (!start || !end) return;
      const durationWidth = (diffDays(start, end) + 1) * CELL_WIDTH;
      const milestone = task.taskType === 2;
      rows.set(task.id, {
        index,
        left: diffDays(timeline.min, start) * CELL_WIDTH + (milestone ? durationWidth / 2 - 9 : 0),
        width: milestone ? 18 : Math.max(18, durationWidth - 4),
      });
    });
    return rows;
  }, [data.tasks, timeline.min]);

  const dependencyLines = useMemo(() => data.dependencies.flatMap(dependency => {
    const source = geometryById.get(dependency.dependsOnId);
    const target = geometryById.get(dependency.taskId);
    if (!source || !target) return [];
    const sourceX = source.left + source.width;
    const targetX = target.left;
    const elbowX = Math.max(sourceX + 7, targetX - 8);
    return [{
      id: dependency.id,
      path: `M ${sourceX} ${source.index * ROW_HEIGHT + 22} H ${elbowX} V ${target.index * ROW_HEIGHT + 22} H ${targetX}`,
    }];
  }), [data.dependencies, geometryById]);

  const todayLeft = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const offset = diffDays(timeline.min, today);
    return today >= timeline.min && today <= timeline.max ? offset * CELL_WIDTH : null;
  }, [timeline]);

  useEffect(() => {
    const header = headerScrollRef.current;
    const body = bodyScrollRef.current;
    if (!header || !body) return;
    const syncHeader = () => { header.scrollLeft = body.scrollLeft; };
    const syncBody = () => { body.scrollLeft = header.scrollLeft; };
    body.addEventListener('scroll', syncHeader, { passive: true });
    header.addEventListener('scroll', syncBody, { passive: true });
    syncHeader();
    return () => {
      body.removeEventListener('scroll', syncHeader);
      header.removeEventListener('scroll', syncBody);
    };
  }, [timeline.width]);

  return <section className="platform-card local-pm-gantt">
    <header><div><span className="card-label">Gantt Chart</span><h3>{data.tasks.length} task · {data.dependencies.length} dependency</h3></div><span className="local-pm-readonly-pill">Read-only</span></header>
    <div className="local-pm-gantt-frame">
      <div className="local-pm-gantt-label-header">Task</div>
      <div className="local-pm-gantt-header-scroll" ref={headerScrollRef}><div className="local-pm-gantt-header-track-wrap" style={{ width: timeline.width }}><div className="local-pm-gantt-months">{timeline.months.map(month => <span key={month.key} style={{ width: month.width }}>{month.label}</span>)}</div><div className="local-pm-gantt-header-track">{timeline.days.map(day => <span key={day.toISOString()} className={day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}>{dayLabel(day)}</span>)}</div></div></div>
      <div className="local-pm-gantt-labels">{data.tasks.map(task => <button type="button" className="local-pm-gantt-label" key={task.id} onClick={() => onSelectTask(task.id)}><strong style={{ paddingLeft: `${(depthById.get(task.id) ?? 0) * 14}px` }}>{task.taskCode}</strong><span>{task.taskName}</span><small>{task.assignees.length ? task.assignees.join(', ') : '—'}</small></button>)}</div>
      <div className="local-pm-gantt-scroll" ref={bodyScrollRef}><div className="local-pm-gantt-tracks" style={{ width: timeline.width }}>{todayLeft !== null && <span className="local-pm-gantt-today" style={{ left: todayLeft }} aria-hidden="true" />}{dependencyLines.length > 0 && <svg className="local-pm-gantt-dependency-svg" width={timeline.width} height={data.tasks.length * ROW_HEIGHT} viewBox={`0 0 ${timeline.width} ${data.tasks.length * ROW_HEIGHT}`} aria-hidden="true"><defs><marker id="local-pm-gantt-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#8ba2b0" /></marker></defs>{dependencyLines.map(line => <path key={line.id} d={line.path} fill="none" stroke="#8ba2b0" strokeWidth="1.2" markerEnd="url(#local-pm-gantt-arrow)" />)}</svg>}{data.tasks.map(task => {
        const start = parseDay(task.startDate);
        const end = parseDay(task.endDate);
        const milestone = task.taskType === 2;
        const left = start ? diffDays(timeline.min, start) * CELL_WIDTH + (milestone && end ? ((diffDays(start, end) + 1) * CELL_WIDTH) / 2 - 9 : 0) : 0;
        const width = milestone ? 18 : start && end ? Math.max(18, (diffDays(start, end) + 1) * CELL_WIDTH - 4) : 18;
        const summary = task.taskType === 3;
        return <div className="local-pm-gantt-track" key={task.id}>{start && end && <button type="button" className={`local-pm-gantt-bar ${statusClass(task)}${milestone ? ' milestone' : ''}${summary ? ' summary' : ''}`} style={{ left, width }} onClick={() => onSelectTask(task.id)} title={`${task.taskCode}: ${task.taskName}`}>
          {!milestone && !summary && <i style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }} />}
          <span>{!milestone && !summary && width > 60 ? task.taskName : ''}</span>
        </button>}</div>;
      })}</div></div>
    </div>
    <div className="local-pm-gantt-dependencies"><span className="card-label">Dependencies</span>{data.dependencies.length ? data.dependencies.map(dependency => <span key={dependency.id}>{taskById.get(dependency.dependsOnId)?.taskCode || `#${dependency.dependsOnId}`} → {taskById.get(dependency.taskId)?.taskCode || `#${dependency.taskId}`}{dependency.lagDays ? ` · lag ${dependency.lagDays}d` : ''}</span>) : <small>Không có dependency.</small>}</div>
  </section>;
}
