import type { ReactNode } from 'react';
import type { ProjectManagementPmbokWorkspace } from './projectManagementClient';

function date(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value.includes(' ') ? value.replace(' ', 'T') : `${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('vi-VN');
}

function money(value: number | null) {
  if (value === null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function decision(value: number) {
  return ({ 0: 'Đang xem xét', 1: 'Đã duyệt', 9: 'Từ chối' } as Record<number, string>)[value] ?? `Mã ${value}`;
}

function Panel({ label, title, children, empty }: { label: string; title: string; children: ReactNode; empty?: boolean }) {
  return <section className="platform-card local-pm-section local-pm-pmbok-section"><header><div><span className="card-label">{label}</span><h3>{title}</h3></div></header>{empty ? <div className="local-pm-inner-empty">Chưa có dữ liệu.</div> : children}</section>;
}

export default function LocalProjectManagementPmbok({ data }: { data: ProjectManagementPmbokWorkspace }) {
  const costTotal = data.costPlans.filter(item => !item.isContingency).reduce((sum, item) => sum + (item.amount ?? 0), 0);
  return <section className="local-pm-pmbok">
    <div className="local-pm-pmbok-heading"><div><span className="card-label">PMBOK target read model</span><h3>Charter, Stakeholder, Resource/RACI và các kế hoạch kiểm soát</h3></div><span className="local-pm-readonly-pill">Read-only</span></div>
    <div className="local-pm-pmbok-grid">
      <Panel label="Project Charter" title="Định hướng project" empty={!data.charter}>{data.charter && <div className="local-pm-charter-grid"><div><span>Business case</span><p>{data.charter.businessCase || '—'}</p></div><div><span>Objectives</span><p>{data.charter.objectives || '—'}</p></div><div><span>In scope</span><p>{data.charter.inScope || '—'}</p></div><div><span>Out scope</span><p>{data.charter.outScope || '—'}</p></div><div><span>Deliverables</span><p>{data.charter.deliverables || '—'}</p></div><div><span>Assumptions / constraints</span><p>{data.charter.assumptions || '—'}<br />{data.charter.constraints || '—'}</p></div><div><span>Sponsor / Product owner</span><p>{data.charter.sponsor || '—'} / {data.charter.productOwner || '—'}</p></div><div><span>Approval</span><p>{decision(data.charter.approvalStatus)} · {data.charter.approvedBy || '—'} · {date(data.charter.approvedAt)}</p></div></div>}</Panel>
      <Panel label="Stakeholder register" title={`${data.stakeholders.length} stakeholder`} empty={!data.stakeholders.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Đối tượng</th><th>Loại</th><th>Vai trò</th><th>Power / Interest</th><th>Chiến lược</th></tr></thead><tbody>{data.stakeholders.map(item => <tr key={item.id}><td><strong>{item.name || item.member || item.partnerCode || '—'}</strong><small>{item.owner || '—'}</small></td><td>{item.stakeholderType}</td><td>{item.role || '—'}</td><td>{item.power || '—'} / {item.interest || '—'}</td><td>{item.engagementStrategy || item.expectation || '—'}</td></tr>)}</tbody></table></div></Panel>
      <Panel label="Resource plan" title={`${data.resources.length} resource`} empty={!data.resources.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Member</th><th>Vai trò</th><th>Team</th><th>Effort</th><th>Mandays</th><th>Unit rate</th></tr></thead><tbody>{data.resources.map(item => <tr key={item.id}><td>{item.member || '—'}</td><td>{item.role || '—'}</td><td>{item.subTeam || '—'}</td><td>{item.effort === null ? '—' : `${Math.round(item.effort * 100)}%`}</td><td>{item.plannedMandays ?? '—'}</td><td>{item.unitRate ?? '—'}</td></tr>)}</tbody></table></div></Panel>
      <Panel label="RACI matrix" title={`${data.raci.length} mapping`} empty={!data.raci.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Activity</th><th>Role</th><th>RACI</th></tr></thead><tbody>{data.raci.map(item => <tr key={item.id}><td>{item.activity}</td><td>{item.role}</td><td><span className="local-pm-raci-value">{item.raciValue || '—'}</span></td></tr>)}</tbody></table></div></Panel>
      <Panel label="Risk register" title={`${data.risks.length} risk`} empty={!data.risks.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Mã</th><th>Rủi ro</th><th>P × I</th><th>Ứng phó</th><th>Review</th></tr></thead><tbody>{data.risks.map(item => <tr key={item.id}><td>{item.riskCode || '—'}</td><td><strong>{item.description || '—'}</strong><small>{item.category || '—'} · {item.owner || '—'}</small></td><td><span className={'local-pm-risk-score score-' + (item.score >= 15 ? 'high' : item.score >= 8 ? 'medium' : 'low')}>{item.score}</span><small>{item.probability ?? '—'} × {item.impact ?? '—'}</small></td><td>{item.response || '—'}<small>{item.triggerDescription || ''}</small></td><td>{date(item.reviewDate)}</td></tr>)}</tbody></table></div></Panel>
      <Panel label="Cost & budget" title={`${data.costPlans.length} cost item`} empty={!data.costPlans.length}><div className="local-pm-cost-total"><span>Subtotal synthetic/read-only</span><strong>{money(costTotal)}</strong></div><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Hạng mục</th><th>Mô tả</th><th>Số tiền</th><th>Dự phòng</th></tr></thead><tbody>{data.costPlans.map(item => <tr key={item.id}><td>{item.itemName || '—'}</td><td>{item.description || '—'}</td><td>{money(item.amount)}</td><td>{item.isContingency ? `${item.contingencyPercent ?? '—'}%` : 'Không'}</td></tr>)}</tbody></table></div></Panel>
      <Panel label="Quality plan" title={`${data.qualityPlans.length} quality criteria`} empty={!data.qualityPlans.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Tiêu chí</th><th>Áp dụng</th><th>Cách kiểm tra</th><th>Acceptance</th><th>Owner</th></tr></thead><tbody>{data.qualityPlans.map(item => <tr key={item.id}><td>{item.criteria || '—'}</td><td>{item.appliesTo || '—'}</td><td>{item.verifyMethod || '—'}</td><td>{item.acceptanceStandard || '—'}</td><td>{item.owner || '—'}</td></tr>)}</tbody></table></div></Panel>
      <Panel label="Definition of Done" title={`${data.definitionOfDone.length} checklist`} empty={!data.definitionOfDone.length}><ol className="local-pm-dod-list">{data.definitionOfDone.map(item => <li key={item.id}>{item.itemText}</li>)}</ol></Panel>
      <Panel label="Communication plan" title={`${data.communicationPlans.length} activity`} empty={!data.communicationPlans.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Hoạt động</th><th>Mục đích</th><th>Đối tượng</th><th>Tần suất</th><th>Kênh</th><th>Owner</th></tr></thead><tbody>{data.communicationPlans.map(item => <tr key={item.id}><td>{item.activity || '—'}</td><td>{item.purpose || '—'}</td><td>{item.audience || '—'}</td><td>{item.frequency || '—'}</td><td>{item.channel || '—'}</td><td>{item.owner || '—'}</td></tr>)}</tbody></table></div></Panel>
      <Panel label="Change log" title={`${data.changeLogs.length} change request`} empty={!data.changeLogs.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Mã / ngày</th><th>Thay đổi</th><th>Người đề xuất</th><th>Ảnh hưởng</th><th>Quyết định</th></tr></thead><tbody>{data.changeLogs.map(item => <tr key={item.id}><td>{item.changeCode || '—'}<small>{date(item.changeDate)}</small></td><td><strong>{item.description || '—'}</strong><small>{item.reason || '—'}</small></td><td>{item.requestedBy || '—'}</td><td>{item.impactScope || '—'}<small>{item.impactTime || '—'} · {item.impactCost || '—'}</small></td><td>{decision(item.decision)}<small>{item.approver || '—'}</small></td></tr>)}</tbody></table></div></Panel>
    </div>
  </section>;
}
