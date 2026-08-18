import type {
  ProjectManagementPmbokWorkspace,
  ProjectManagementWorkspace,
} from './projectManagementClient';

type FlowStatus = 'done' | 'progress' | 'todo' | 'auto' | 'na';

type FlowMetric = {
  label: string;
  value: string;
};

type FlowStep = {
  key: string;
  title: string;
  phase: string;
  status: FlowStatus;
  percent: number;
  kind: 'setup' | 'execution' | 'auto';
  mvp: boolean;
  metrics: FlowMetric[];
  note?: string;
};

const PHASES = ['Khởi tạo', 'Lập kế hoạch', 'Giám sát'];
const OPENABLE_STEPS = new Set(['charter', 'stakeholder', 'wbs', 'schedule', 'resource', 'cost', 'risk', 'quality', 'communication', 'change_log']);
const PMBOK_STEPS = new Set(['charter', 'stakeholder', 'resource', 'cost', 'risk', 'quality', 'communication', 'change_log']);

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function filled(value: string | null | undefined) {
  return Boolean(value && value.trim());
}

function activeCount<T extends { status: number }>(items: T[]) {
  return items.filter(item => item.status !== 9).length;
}

function money(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function buildFlow(workspace: ProjectManagementWorkspace, pmbok: ProjectManagementPmbokWorkspace | null): FlowStep[] {
  const tasks = workspace.tasks.map(item => item.task);
  const hasSourceProject = workspace.project.sourceProjectId !== null;
  const taskCount = tasks.length;
  const scheduledCount = tasks.filter(task => task.startDate && task.endDate).length;
  const averageProgress = taskCount
    ? clamp(tasks.reduce((sum, task) => sum + Number(task.progress || 0), 0) / taskCount)
    : 0;
  const assignedCount = workspace.tasks.filter(item => item.assignees.length > 0).length;
  const dependencyCount = workspace.tasks.reduce((sum, item) => sum + item.dependencies.length, 0);

  const charter = pmbok?.charter;
  const charterFields = charter
    ? [charter.businessCase, charter.objectives, charter.inScope, charter.outScope, charter.deliverables, charter.sponsor, charter.productOwner]
    : [];
  const charterFilled = charterFields.filter(filled).length;
  const charterApproved = charter?.approvalStatus === 2;

  const stakeholders = pmbok ? activeCount(pmbok.stakeholders) : 0;
  const internalStakeholders = pmbok?.stakeholders.filter(item => item.status !== 9 && item.stakeholderType === 'INTERNAL').length ?? 0;
  const externalStakeholders = pmbok?.stakeholders.filter(item => item.status !== 9 && item.stakeholderType === 'EXTERNAL').length ?? 0;
  // Jarvis's pm-flow query treats a stakeholder as classified once `power` is
  // present. Keep that rule here; requiring interest as well incorrectly marks
  // source-compatible rows as incomplete.
  const stakeholderWithPower = pmbok?.stakeholders.filter(item => item.status !== 9 && filled(item.power)).length ?? 0;
  const resources = pmbok ? activeCount(pmbok.resources) : 0;
  const resourceMandays = pmbok
    ? pmbok.resources.filter(item => item.status !== 9).reduce((sum, item) => sum + (item.plannedMandays ?? 0), 0)
    : 0;
  const raci = pmbok ? activeCount(pmbok.raci) : 0;
  const risks = pmbok ? pmbok.risks.filter(item => item.status !== 9) : [];
  const riskIncomplete = risks.filter(item => !filled(item.response) || !filled(item.owner)).length;
  const costPlans = pmbok ? pmbok.costPlans.filter(item => item.status !== 9) : [];
  const qualityPlans = pmbok ? activeCount(pmbok.qualityPlans) : 0;
  const definitionOfDone = pmbok ? activeCount(pmbok.definitionOfDone) : 0;
  const communicationPlans = pmbok ? activeCount(pmbok.communicationPlans) : 0;
  const changeLogs = pmbok ? activeCount(pmbok.changeLogs) : 0;
  const charterProxyFilled = [
    workspace.project.projectManager,
    workspace.project.customer,
    workspace.project.budget > 0 ? 'budget' : '',
    workspace.project.startDate,
    workspace.project.endDate,
  ].filter(filled).length;
  const costSubtotal = costPlans.filter(item => !item.isContingency).reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const contingencyPercent = costPlans
    .filter(item => item.isContingency)
    .reduce((max, item) => Math.max(max, item.contingencyPercent ?? 0), 0);
  const plannedCost = costSubtotal * (1 + contingencyPercent / 100);
  const costOverBudget = workspace.project.budget > 0 && plannedCost > workspace.project.budget;

  return [
    {
      key: 'charter', title: 'Project Charter', phase: 'Khởi tạo', kind: 'setup', mvp: true,
      status: !pmbok
        ? charterProxyFilled >= 3 ? 'progress' : 'todo'
        : charterApproved ? 'done' : charterFilled ? 'progress' : 'todo',
      percent: !pmbok ? clamp(charterProxyFilled / 5 * 100) : clamp(charterFilled / 7 * 100),
      metrics: !pmbok
        ? [
            { label: 'PM', value: workspace.project.projectManager || '—' },
            { label: 'Sponsor', value: '—' },
            { label: 'Phê duyệt', value: 'Chưa thiết lập' },
          ]
        : [
            { label: 'Trường đã điền', value: `${charterFilled}/7` },
            { label: 'PM', value: workspace.project.projectManager || '—' },
            { label: 'Phê duyệt', value: charter ? (charterApproved ? 'Đã duyệt' : 'Chưa duyệt') : 'Chưa có charter' },
          ],
      note: !pmbok ? 'Đang hiển thị proxy từ thông tin project; mở Charter để xem dữ liệu PMBOK target.' : charterApproved ? 'Charter target đã được phê duyệt.' : 'Charter target chưa hoàn tất hoặc chưa được phê duyệt.',
    },
    {
      key: 'stakeholder', title: 'Stakeholder Register', phase: 'Khởi tạo', kind: 'setup', mvp: false,
      status: !pmbok ? 'na' : stakeholders > 0 ? 'progress' : 'todo',
      percent: !pmbok ? 0 : clamp(stakeholders / 4 * 100),
      metrics: !pmbok
        ? [{ label: 'Stakeholder', value: 'Chưa thiết lập' }]
        : [
            { label: 'Stakeholder', value: String(stakeholders) },
            { label: 'Nội bộ', value: String(internalStakeholders) },
            { label: 'Bên ngoài', value: String(externalStakeholders) },
          ],
      note: !pmbok ? 'Đăng ký stakeholder chỉ được hiển thị sau khi tải PMBOK target.' : stakeholderWithPower < stakeholders ? 'Còn stakeholder chưa gán Quyền lực.' : undefined,
    },
    {
      key: 'wbs', title: 'Scope & WBS', phase: 'Lập kế hoạch', kind: 'setup', mvp: true,
      status: !hasSourceProject ? 'na' : taskCount > 0 ? 'progress' : 'todo',
      percent: hasSourceProject && taskCount ? clamp(scheduledCount / taskCount * 100) : 0,
      metrics: [
        { label: 'Task WBS', value: String(taskCount) },
        { label: 'Có lịch', value: String(scheduledCount) },
        { label: 'Assignment', value: String(assignedCount) },
      ],
      note: !hasSourceProject ? 'Dự án chưa gắn project nguồn nên chưa có WBS để theo dõi.' : taskCount ? 'WBS được đọc từ pm_project_task target; tỷ lệ hiển thị là độ phủ ngày kế hoạch.' : 'Project chưa có task target.',
    },
    {
      key: 'schedule', title: 'Schedule & Gantt', phase: 'Lập kế hoạch', kind: 'execution', mvp: true,
      status: !hasSourceProject ? 'na' : scheduledCount > 0 ? 'progress' : 'todo',
      percent: hasSourceProject && taskCount ? averageProgress : 0,
      metrics: [
        { label: 'Tiến độ task', value: `${averageProgress}%` },
        { label: 'Độ phủ lịch', value: `${taskCount ? clamp(scheduledCount / taskCount * 100) : 0}%` },
        { label: 'Phụ thuộc', value: String(dependencyCount) },
      ],
      note: !hasSourceProject ? 'Dự án chưa gắn project nguồn nên chưa có Schedule/Gantt.' : scheduledCount ? 'Tiến độ task và lịch dependency đang được đọc từ target workspace.' : 'Chưa đủ ngày bắt đầu/kết thúc để dựng lịch target.',
    },
    {
      key: 'resource', title: 'Resource & RACI', phase: 'Lập kế hoạch', kind: 'setup', mvp: false,
      status: !pmbok ? 'na' : resources > 0 && raci > 0 ? 'done' : resources > 0 || raci > 0 ? 'progress' : 'todo',
      percent: !pmbok ? 0 : (resources > 0 ? 50 : 0) + (raci > 0 ? 50 : 0),
      metrics: !pmbok
        ? [{ label: 'Resource/RACI', value: 'Chưa thiết lập' }]
        : [
            { label: 'Nhân sự (kế hoạch)', value: String(resources) },
            { label: 'Tổng mandays KH', value: String(resourceMandays) },
            { label: 'Ô RACI', value: String(raci) },
            { label: 'Task có assignment', value: String(assignedCount) },
          ],
      note: !pmbok ? 'Mở PMBOK để đọc resource plan và ma trận RACI target.' : resources && raci ? undefined : 'Cần bổ sung cả resource plan và RACI.',
    },
    {
      key: 'cost', title: 'Cost & Budget', phase: 'Lập kế hoạch', kind: 'setup', mvp: true,
      status: !pmbok ? 'na' : costPlans.length > 0 ? (costOverBudget ? 'progress' : 'done') : workspace.project.budget > 0 ? 'progress' : 'todo',
      percent: !pmbok ? 0 : costPlans.length > 0 ? 100 : workspace.project.budget > 0 ? 50 : 0,
      metrics: !pmbok
        ? [{ label: 'Cost plan', value: 'Chưa thiết lập' }]
        : [
            { label: 'Ngân sách project', value: money(workspace.project.budget) },
            { label: 'Hạng mục dự toán', value: String(costPlans.length) },
            { label: 'Tổng dự toán', value: money(plannedCost) },
          ],
      note: !pmbok ? 'Chưa đọc cost plan target; không hiển thị chi phí thực từ nguồn ngoài.' : costOverBudget ? 'Tổng dự toán vượt trần ngân sách.' : costPlans.length ? undefined : 'Project có ngân sách nhưng chưa có dòng cost plan target.',
    },
    {
      key: 'risk', title: 'Risk Register', phase: 'Giám sát', kind: 'setup', mvp: false,
      status: !pmbok ? 'na' : risks.length > 0 ? (riskIncomplete === 0 ? 'done' : 'progress') : 'todo',
      percent: !pmbok ? 0 : risks.length > 0 ? (riskIncomplete === 0 ? 100 : 70) : 0,
      metrics: !pmbok
        ? [{ label: 'Rủi ro', value: 'Chưa thiết lập' }]
        : [
            { label: 'Rủi ro', value: String(risks.length) },
            { label: 'Mức cao (≥15)', value: String(risks.filter(item => item.score >= 15).length) },
            { label: 'Thiếu ứng phó/chủ trì', value: String(riskIncomplete) },
          ],
      note: !pmbok ? 'Mở PMBOK để đọc risk register target.' : riskIncomplete ? 'Còn rủi ro chưa có phương án ứng phó hoặc chủ trì.' : risks.length ? undefined : 'Chưa ghi nhận rủi ro target.',
    },
    {
      key: 'quality', title: 'Quality Plan + DoD', phase: 'Giám sát', kind: 'setup', mvp: false,
      status: !pmbok ? 'na' : qualityPlans > 0 && definitionOfDone >= 3 ? 'done' : qualityPlans > 0 || definitionOfDone > 0 ? 'progress' : 'todo',
      percent: !pmbok ? 0 : (qualityPlans > 0 ? 50 : 0) + (definitionOfDone >= 3 ? 50 : definitionOfDone > 0 ? 25 : 0),
      metrics: !pmbok
        ? [{ label: 'Quality/DoD', value: 'Chưa thiết lập' }]
        : [
            { label: 'Tiêu chí chất lượng', value: String(qualityPlans) },
            { label: 'Mục DoD', value: String(definitionOfDone) },
          ],
      note: !pmbok ? 'Mở PMBOK để đọc quality plan và Definition of Done target.' : definitionOfDone < 3 ? 'Nên có tối thiểu 3 mục Definition of Done.' : undefined,
    },
    {
      key: 'communication', title: 'Communication Plan', phase: 'Giám sát', kind: 'setup', mvp: false,
      status: !pmbok ? 'na' : communicationPlans >= 3 ? 'done' : communicationPlans > 0 ? 'progress' : 'todo',
      percent: !pmbok ? 0 : clamp(communicationPlans / 3 * 100),
      metrics: [{ label: 'Kế hoạch trao đổi', value: pmbok ? String(communicationPlans) : 'Chưa thiết lập' }],
      note: !pmbok ? 'Mở PMBOK để đọc communication plan target.' : communicationPlans < 3 ? 'Nên có tối thiểu daily, weekly và steering/reporting.' : undefined,
    },
    {
      key: 'change_log', title: 'Change Log', phase: 'Giám sát', kind: 'setup', mvp: false,
      status: !pmbok ? 'na' : changeLogs > 0 ? 'done' : 'todo',
      percent: !pmbok ? 0 : changeLogs > 0 ? 100 : 0,
      metrics: [{ label: 'Change request', value: pmbok ? String(changeLogs) : 'Chưa thiết lập' }],
      note: !pmbok ? 'Mở PMBOK để đọc change log target.' : changeLogs === 0 ? 'Chưa ghi nhận thay đổi nào trong target.' : undefined,
    },
    {
      key: 'dashboard', title: 'Dashboard tổng hợp', phase: 'Giám sát', kind: 'auto', mvp: true,
      status: 'auto', percent: averageProgress,
      metrics: [
        { label: 'Tiến độ task TB', value: `${averageProgress}%` },
        { label: 'Task hoàn tất', value: String(tasks.filter(task => task.status === 3 || task.progress >= 100).length) },
        { label: 'Summary tuần', value: String(workspace.summaries.length) },
        { label: 'Plan tuần', value: String(workspace.plans.length) },
      ],
      note: 'Tự tổng hợp từ workspace target; không dùng Redmine, cost cache hoặc dữ liệu HR/finance.',
    },
  ];
}

const STATUS_LABEL: Record<FlowStatus, string> = {
  done: 'Done',
  progress: 'Đang làm',
  todo: 'Chưa bắt đầu',
  auto: 'Tự động',
  na: 'Chưa thiết lập',
};

export default function LocalProjectManagementFlow({
  workspace,
  pmbok,
  pmbokLoading,
  onOpenStep,
}: {
  workspace: ProjectManagementWorkspace;
  pmbok: ProjectManagementPmbokWorkspace | null;
  pmbokLoading: boolean;
  onOpenStep?: (key: string) => void;
}) {
  const steps = buildFlow(workspace, pmbok);

  return <section className="local-pm-flow">
    <div className="local-pm-flow-heading">
    <div><span className="card-label">PM Flow · target read model</span><h3>Dòng chảy quản lý dự án</h3><p>11 bước PMBOK được tính từ dữ liệu target đang có; các bảng chưa thiết lập được giữ ở trạng thái riêng.</p></div>
      <span className="local-pm-readonly-pill">Read-only</span>
    </div>
    <div className="local-pm-flow-grid">
      {PHASES.map(phase => <div className="local-pm-flow-phase" key={phase}>
        <div className="local-pm-flow-phase-heading"><span>{phase}</span><small>{steps.filter(step => step.phase === phase).length} bước</small></div>
        {steps.filter(step => step.phase === phase).map(step => <article className={`local-pm-flow-step kind-${step.kind} status-${step.status}`} key={step.key}>
          <div className="local-pm-flow-rail"><strong>{steps.indexOf(step) + 1}</strong><i /></div>
          <div className="local-pm-flow-body">
            <div className="local-pm-flow-top"><h4>{step.title}</h4><div className="local-pm-flow-actions"><span className="local-pm-flow-status">{STATUS_LABEL[step.status]}</span>{step.mvp && <span className="local-pm-flow-mvp">MVP</span>}{OPENABLE_STEPS.has(step.key) ? <button type="button" className="btn btn-outline-secondary btn-sm local-pm-flow-na-action" onClick={() => onOpenStep?.(step.key === 'schedule' ? 'wbs' : step.key)} disabled={pmbokLoading && PMBOK_STEPS.has(step.key)}>{pmbokLoading && PMBOK_STEPS.has(step.key) ? 'Đang tải PMBOK...' : 'Mở →'}</button> : <span className="local-pm-flow-coming-soon">Sắp có</span>}</div></div>
            {step.status !== 'na' && <div className="local-pm-flow-progress"><span><i style={{ width: `${step.percent}%` }} /></span><strong>{step.percent}%</strong></div>}
            <div className="local-pm-flow-metrics">{step.metrics.map(metric => <div className="local-pm-flow-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}</div>
            {step.note && <p className="local-pm-flow-note">{step.note}</p>}
          </div>
        </article>)}
      </div>)}
    </div>
    <div className="local-pm-flow-legend" aria-label="Chú giải trạng thái PM Flow">
      <span className="local-pm-flow-legend-chip status-done"><i />Done</span>
      <span className="local-pm-flow-legend-chip status-progress"><i />Đang làm</span>
      <span className="local-pm-flow-legend-chip status-todo"><i />Chưa bắt đầu</span>
      <span className="local-pm-flow-legend-chip status-auto"><i />Tự động</span>
      <span className="local-pm-flow-legend-chip status-na"><i />Chưa thiết lập</span>
      <span className="local-pm-flow-legend-note">Rail cam = setup · rail tím = tự động · MVP = bước cốt lõi</span>
    </div>
  </section>;
}

export { buildFlow };
