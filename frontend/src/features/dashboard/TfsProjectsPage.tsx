import { useEffect, useMemo, useState } from 'react';
import { getTfsIterations, getTfsProject, getTfsProjects, getTfsTeams, getTfsWorkItems, type TfsIteration, type TfsProject, type TfsTeam, type TfsWorkItem } from '../auth/tfsProjectClient';

export default function TfsProjectsPage() {
  const targetMode = (import.meta.env.VITE_AUTH_MODE ?? 'legacy') === 'target-dev';
  const [projects, setProjects] = useState<TfsProject[]>([]);
  const [selected, setSelected] = useState<TfsProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<TfsTeam[]>([]);
  const [iterations, setIterations] = useState<TfsIteration[]>([]);
  const [workItems, setWorkItems] = useState<TfsWorkItem[]>([]);
  const [workItemTotal, setWorkItemTotal] = useState(0);
  const [dataLoading, setDataLoading] = useState<string | null>(null);

  const collections = useMemo(() => {
    const grouped = new Map<string, TfsProject[]>();
    for (const project of projects) grouped.set(project.collection, [...(grouped.get(project.collection) ?? []), project]);
    return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [projects]);

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      setProjects(await getTfsProjects());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load TFS projects.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (targetMode) void loadProjects(); else setLoading(false); }, [targetMode]);

  async function selectProject(project: TfsProject) {
    setSelected(project);
    setDetailLoading(true);
    setError(null);
    try {
      setSelected(await getTfsProject(project));
      setTeams([]);
      setIterations([]);
      setWorkItems([]);
      setWorkItemTotal(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load project details.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadProjectData(kind: 'teams' | 'iterations' | 'work-items') {
    if (!selected) return;
    setDataLoading(kind);
    setError(null);
    try {
      if (kind === 'teams') setTeams(await getTfsTeams(selected));
      if (kind === 'iterations') setIterations(await getTfsIterations(selected));
      if (kind === 'work-items') {
        const result = await getTfsWorkItems(selected);
        setWorkItems(result.items);
        setWorkItemTotal(result.totalAvailable);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load TFS project data.');
    } finally {
      setDataLoading(null);
    }
  }

  if (!targetMode) return <section className="platform-card"><h2>TFS Projects</h2><p>Switch the frontend to <code>VITE_AUTH_MODE=target-dev</code> to use the target TFS session.</p></section>;

  return <section className="projects-page">
    <div className="page-heading">
      <div><p className="eyebrow">TFS Project Management</p><h2>Projects</h2><p className="muted">Read-only project catalog discovered from the TFS account.</p></div>
      <button type="button" onClick={() => void loadProjects()} disabled={loading}>{loading ? 'Loading...' : 'Reload'}</button>
    </div>
    {error && <p className="error">{error}</p>}
    {loading && <p className="muted">Loading projects from TFS...</p>}
    {!loading && !projects.length && !error && <p className="muted">No readable TFS projects were returned.</p>}
    <div className="projects-layout">
      <div className="project-collections">
        {collections.map(([collection, items]) => <section className="project-collection" key={collection}>
          <h3>{collection}</h3>
          {items.map(project => <button className={'project-item' + (selected?.id === project.id && selected.collection === project.collection ? ' selected' : '')} type="button" key={project.collection + '/' + project.id} onClick={() => void selectProject(project)}>
            <strong>{project.name}</strong><small>{project.state ?? 'unknown'} · {project.id}</small>
          </button>)}
        </section>)}
      </div>
      <aside className="project-detail platform-card">
        {!selected && <p className="muted">Select a project to view its TFS details.</p>}
        {selected && <><span className="card-label">{selected.collection}</span><h3>{selected.name}</h3><p>{selected.description || 'No description returned by TFS.'}</p><dl><dt>Project ID</dt><dd>{selected.id}</dd><dt>State</dt><dd>{selected.state ?? 'unknown'}</dd><dt>API URL</dt><dd className="break-all">{selected.url}</dd></dl>{detailLoading && <small className="muted">Refreshing details...</small>}<div className="project-actions"><button type="button" onClick={() => void loadProjectData('teams')} disabled={dataLoading !== null}>Teams</button><button type="button" onClick={() => void loadProjectData('iterations')} disabled={dataLoading !== null}>Iterations</button><button type="button" onClick={() => void loadProjectData('work-items')} disabled={dataLoading !== null}>Work items</button></div>{dataLoading && <small className="muted">Loading {dataLoading} from TFS...</small>}{teams.length > 0 && <div><h4>Teams ({teams.length})</h4><ul>{teams.map(team => <li key={team.id}>{team.name}</li>)}</ul></div>}{iterations.length > 0 && <div><h4>Iterations ({iterations.length})</h4><ul>{iterations.map(iteration => <li key={iteration.id}>{iteration.name} <small>{iteration.timeFrame ?? ''}</small></li>)}</ul></div>}{workItems.length > 0 && <div><h4>Work items ({workItems.length}/{workItemTotal})</h4><ul>{workItems.map(item => <li key={item.id}>#{item.id} {item.title ?? '(untitled)'} <small>{item.state ?? ''}</small></li>)}</ul></div>}</>}
      </aside>
    </div>
  </section>;
}
