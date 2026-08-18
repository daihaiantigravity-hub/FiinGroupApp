import { useEffect, useState, type ReactNode } from 'react';
import type { ProjectManagementPmbokWorkspace } from './projectManagementClient';

export type PmbokTabKey = 'charter' | 'stakeholder' | 'resource' | 'cost' | 'risk' | 'quality' | 'communication' | 'change_log';

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
  return ({ 0: 'Đang xem xét', 1: 'Đã duyệt', 9: 'Từ chối' } as Record<number, string>)[value] ?? ('Mã ' + value);
}

function approval(value: number) {
  return ({ 0: 'Nháp', 1: 'Chờ duyệt', 2: 'Đã duyệt', 9: 'Từ chối' } as Record<number, string>)[value] ?? ('Mã ' + value);
}

function Panel({ label, title, children, empty, showHeader = true }: { label: string; title: string; children: ReactNode; empty?: boolean; showHeader?: boolean }) {
  return <section className="platform-card local-pm-section local-pm-pmbok-section">{showHeader && <header><div><span className="card-label">{label}</span><h3>{title}</h3></div></header>}{empty ? <div className="local-pm-inner-empty">Chưa có dữ liệu.</div> : children}</section>;
}

function SubTabs({ tabs, active, onChange }: { tabs: Array<{ key: string; label: string; disabled?: boolean }>; active: string; onChange: (key: string) => void }) {
  return <div className="local-pm-pmbok-subtabs" role="tablist">
    {tabs.map(tab => <button type="button" role="tab" key={tab.key} aria-selected={active === tab.key} disabled={tab.disabled} className={active === tab.key ? 'active' : ''} onClick={() => onChange(tab.key)}>{tab.label}</button>)}
  </div>;
}

export default function LocalProjectManagementPmbok({ data, requestedTab }: { data: ProjectManagementPmbokWorkspace; requestedTab?: PmbokTabKey }) {
  const [activeTab, setActiveTab] = useState<PmbokTabKey>(requestedTab ?? 'charter');
  const [resourcePane, setResourcePane] = useState<'resource' | 'raci'>('resource');
  const [qualityPane, setQualityPane] = useState<'quality' | 'dod'>('quality');
  const [changePane, setChangePane] = useState<'requests' | 'journal'>('requests');
  useEffect(() => { if (requestedTab) setActiveTab(requestedTab); }, [requestedTab]);
  const costTotal = data.costPlans.filter(item => !item.isContingency).reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const activeHeading = ({
    charter: ['Project Charter', 'Project Charter'],
    stakeholder: ['Stakeholder Register', 'Stakeholder Register'],
    resource: ['Resource & RACI', 'Resource & RACI'],
    cost: ['Cost & Budget', 'Dự toán chi phí'],
    risk: ['Risk Register', 'Risk Register'],
    quality: ['Quality Plan + DoD', 'Quality Plan + DoD'],
    communication: ['Communication Plan', 'Communication Plan'],
    change_log: ['Change Log', 'Change Log'],
  } as Record<PmbokTabKey, [string, string]>)[activeTab];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'charter':
        return <Panel label="Project Charter" title="Project Charter" showHeader={false} empty={!data.charter}>{data.charter && <div className="local-pm-charter-grid"><div><span>Business case</span><p>{data.charter.businessCase || '—'}</p></div><div><span>Objectives</span><p>{data.charter.objectives || '—'}</p></div><div><span>In scope</span><p>{data.charter.inScope || '—'}</p></div><div><span>Out scope</span><p>{data.charter.outScope || '—'}</p></div><div><span>Deliverables</span><p>{data.charter.deliverables || '—'}</p></div><div><span>Assumptions / constraints</span><p>{data.charter.assumptions || '—'}<br />{data.charter.constraints || '—'}</p></div><div><span>High risks</span><p>{data.charter.highRisks || '—'}</p></div><div><span>Sponsor / Product owner</span><p>{data.charter.sponsor || '—'} / {data.charter.productOwner || '—'}</p></div><div><span>Approval</span><p>{approval(data.charter.approvalStatus)} · {data.charter.approvedBy || '—'} · {date(data.charter.approvedAt)}</p></div></div>}</Panel>;
      case 'stakeholder':
        return <Panel label="Stakeholder register" title="Stakeholder register" showHeader={false} empty={!data.stakeholders.length}><div className="stk-tablewrap local-pm-stakeholder-tablewrap"><table className="stk-table local-pm-stakeholder-table"><thead><tr><th>Stakeholder</th><th>Vai trò</th><th>Quyền lực</th><th>Quan tâm</th><th>Phụ trách</th></tr></thead><tbody>{data.stakeholders.map(item => <tr key={item.id}><td><span className="stk-name">{item.name || item.member || item.partnerCode || '—'}<span className={`stk-type-tag ${item.stakeholderType}`}>{item.stakeholderType === 'INTERNAL' ? 'nội bộ' : 'ngoài'}</span></span>{(item.partnerCode || item.member) && <span className="co">{item.partnerCode || item.member}</span>}</td><td>{item.role || '—'}</td><td><span className={`stk-pi ${item.power ? item.power === 'Cao' ? 'Cao' : item.power === 'TB' ? 'TB' : 'Thap' : 'none'}`}>{item.power || '—'}</span></td><td><span className={`stk-pi ${item.interest ? item.interest === 'Cao' ? 'Cao' : item.interest === 'TB' ? 'TB' : 'Thap' : 'none'}`}>{item.interest || '—'}</span></td><td>{item.owner || '—'}</td></tr>)}</tbody></table></div></Panel>;
      case 'resource':
        return <div className="local-pm-pmbok-pane"><SubTabs tabs={[{ key: 'resource', label: 'Kế hoạch nhân sự' }, { key: 'raci', label: 'Ma trận RACI' }]} active={resourcePane} onChange={key => setResourcePane(key as 'resource' | 'raci')} />{resourcePane === 'resource' ? <Panel label="Resource plan" title={`${data.resources.length} resource`} showHeader={false} empty={!data.resources.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Member</th><th>Vai trò</th><th>Team</th><th>Effort</th><th>Mandays</th><th>Unit rate</th></tr></thead><tbody>{data.resources.map(item => <tr key={item.id}><td>{item.member || '—'}</td><td>{item.role || '—'}</td><td>{item.subTeam || '—'}</td><td>{item.effort === null ? '—' : `${Math.round(item.effort * 100)}%`}</td><td>{item.plannedMandays ?? '—'}</td><td>{item.unitRate ?? '—'}</td></tr>)}</tbody></table></div></Panel> : <Panel label="RACI matrix" title={`${data.raci.length} mapping`} showHeader={false} empty={!data.raci.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Activity</th><th>Role</th><th>RACI</th></tr></thead><tbody>{data.raci.map(item => <tr key={item.id}><td>{item.activity}</td><td>{item.role}</td><td><span className="local-pm-raci-value">{item.raciValue || '—'}</span></td></tr>)}</tbody></table></div></Panel>}</div>;
      case 'cost':
        return <Panel label="Cost & budget" title="Dự toán chi phí" showHeader={false} empty={!data.costPlans.length}><div className="local-pm-cost-total"><span>Subtotal synthetic/read-only</span><strong>{money(costTotal)}</strong></div><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Hạng mục</th><th>Mô tả</th><th>Số tiền</th><th>Dự phòng</th></tr></thead><tbody>{data.costPlans.map(item => <tr key={item.id}><td>{item.itemName || '—'}</td><td>{item.description || '—'}</td><td>{money(item.amount)}</td><td>{item.isContingency ? `${item.contingencyPercent ?? '—'}%` : 'Không'}</td></tr>)}</tbody></table></div></Panel>;
      case 'risk':
        return <Panel label="Risk register" title="Risk Register" showHeader={false} empty={!data.risks.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Mã</th><th>Rủi ro</th><th>P × I</th><th>Ứng phó</th><th>Review</th></tr></thead><tbody>{data.risks.map(item => <tr key={item.id}><td>{item.riskCode || '—'}</td><td><strong>{item.description || '—'}</strong><small>{item.category || '—'} · {item.owner || '—'}</small></td><td><span className={'local-pm-risk-score score-' + (item.score >= 15 ? 'high' : item.score >= 8 ? 'medium' : 'low')}>{item.score}</span><small>{item.probability ?? '—'} × {item.impact ?? '—'}</small></td><td>{item.response || '—'}<small>{item.triggerDescription || ''}</small></td><td>{date(item.reviewDate)}</td></tr>)}</tbody></table></div></Panel>;
      case 'quality':
        return <div className="local-pm-pmbok-pane"><SubTabs tabs={[{ key: 'quality', label: 'Tiêu chí chất lượng' }, { key: 'dod', label: 'Definition of Done' }]} active={qualityPane} onChange={key => setQualityPane(key as 'quality' | 'dod')} />{qualityPane === 'quality' ? <Panel label="Quality plan" title="Quality Plan" showHeader={false} empty={!data.qualityPlans.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Tiêu chí</th><th>Áp dụng</th><th>Cách kiểm tra</th><th>Acceptance</th><th>Owner</th></tr></thead><tbody>{data.qualityPlans.map(item => <tr key={item.id}><td>{item.criteria || '—'}</td><td>{item.appliesTo || '—'}</td><td>{item.verifyMethod || '—'}</td><td>{item.acceptanceStandard || '—'}</td><td>{item.owner || '—'}</td></tr>)}</tbody></table></div></Panel> : <Panel label="Definition of Done" title="Definition of Done" showHeader={false} empty={!data.definitionOfDone.length}><ol className="local-pm-dod-list">{data.definitionOfDone.map(item => <li key={item.id}>{item.itemText}</li>)}</ol></Panel>}</div>;
      case 'communication':
        return <Panel label="Communication plan" title="Communication Plan" showHeader={false} empty={!data.communicationPlans.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Hoạt động</th><th>Mục đích</th><th>Đối tượng</th><th>Tần suất</th><th>Kênh</th><th>Owner</th></tr></thead><tbody>{data.communicationPlans.map(item => <tr key={item.id}><td>{item.activity || '—'}</td><td>{item.purpose || '—'}</td><td>{item.audience || '—'}</td><td>{item.frequency || '—'}</td><td>{item.channel || '—'}</td><td>{item.owner || '—'}</td></tr>)}</tbody></table></div></Panel>;
      case 'change_log':
        return <div className="local-pm-pmbok-pane"><SubTabs tabs={[{ key: 'requests', label: 'Change requests (PM nhập)' }, { key: 'journal', label: 'Từ nguồn tự động' }]} active={changePane} onChange={key => setChangePane(key as 'requests' | 'journal')} />{changePane === 'journal' ? <div className="local-pm-inner-empty local-pm-source-empty">Chưa có projection Change Journal từ nguồn tự động trong target read model.</div> : <Panel label="Change log" title="Change Log" showHeader={false} empty={!data.changeLogs.length}><div className="table-scroll-x"><table className="data-table"><thead><tr><th>Mã / ngày</th><th>Thay đổi</th><th>Người đề xuất</th><th>Ảnh hưởng</th><th>Quyết định</th></tr></thead><tbody>{data.changeLogs.map(item => <tr key={item.id}><td>{item.changeCode || '—'}<small>{date(item.changeDate)}</small></td><td><strong>{item.description || '—'}</strong><small>{item.reason || '—'}</small></td><td>{item.requestedBy || '—'}</td><td>{item.impactScope || '—'}<small>{item.impactTime || '—'} · {item.impactCost || '—'}</small></td><td>{decision(item.decision)}<small>{item.approver || '—'}</small></td></tr>)}</tbody></table></div></Panel>}</div>;
    }
  };

  return <section className="local-pm-pmbok">
    <div className="local-pm-pmbok-heading"><div><span className="card-label">{activeHeading[0]}</span><h3>{activeHeading[1]}</h3></div><span className="local-pm-readonly-pill">Read-only</span></div>
    <div className="local-pm-pmbok-grid">{renderActiveTab()}</div>
  </section>;
}
