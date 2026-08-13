import { useEffect, useState } from 'react';
import { legacyAuthClient, type LegacyAnnouncementItem, type LegacyWikiItem } from '../auth/legacyAuthClient';

type ContentKind = 'wiki' | 'announcements';

function badgeLabel(kind: ContentKind, value: string | number | null) {
  if (kind === 'wiki') {
    if (value === 'business') return 'Nghiệp vụ';
    if (value === 'technical') return 'Kỹ thuật';
    return value || '—';
  }
  const labels: Record<string, string> = { announcement: 'Thông báo', regulation: 'Nội quy', document: 'Tài liệu', guide: 'Hướng dẫn' };
  return labels[String(value)] || value || '—';
}

function statusLabel(status: number | null) { return status === 1 ? 'Hiệu lực' : 'Ngừng'; }

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

export default function KnowledgePage({ kind }: { kind: ContentKind }) {
  const legacyMode = (import.meta.env.VITE_AUTH_MODE ?? 'legacy') !== 'target-dev';
  const [wikiItems, setWikiItems] = useState<LegacyWikiItem[]>([]);
  const [announcementItems, setAnnouncementItems] = useState<LegacyAnnouncementItem[]>([]);
  const [category, setCategory] = useState('');
  const [levelOrPriority, setLevelOrPriority] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LegacyWikiItem | LegacyAnnouncementItem | null>(null);

  async function load() {
    if (!legacyMode) { setError('Target TFS session chưa có API Wiki/Thông báo được phê duyệt.'); return; }
    setLoading(true);
    setError(null);
    try {
      if (kind === 'wiki') {
        setWikiItems(await legacyAuthClient.wikiList({ category, level: levelOrPriority, search }));
      } else {
        setAnnouncementItems(await legacyAuthClient.announcementList({ category, priority: levelOrPriority, search }));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!legacyMode) {
      setError('Target TFS session chưa có API Wiki/Thông báo được phê duyệt.');
      return;
    }
    const timer = window.setTimeout(() => void load(), search ? 400 : 0);
    return () => window.clearTimeout(timer);
  }, [category, kind, legacyMode, levelOrPriority, search]);

  const wiki = kind === 'wiki';
  const title = wiki ? 'Wiki nội bộ' : 'Thông báo & Tài liệu';
  const items = wiki ? wikiItems : announcementItems;

  return <section className="knowledge-page">
    <div className="page-header-wrapper"><div className="page-title-row"><h1 className="page-title"><span className="title-icon knowledge-title-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={wiki ? 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' : 'M21 3L9 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2l2 7h2l-2-7h2l12 6V3z'} /><path d={wiki ? 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' : 'M15.54 8.46a5 5 0 0 1 0 7.07'} /></svg></span>{title}</h1></div><div className="page-toolbar knowledge-toolbar"><div className="toolbar-filters"><select value={category} onChange={event => setCategory(event.target.value)}><option value="">-- Phân loại --</option>{wiki ? <><option value="business">Nghiệp vụ</option><option value="technical">Kỹ thuật</option></> : <><option value="announcement">Thông báo</option><option value="regulation">Nội quy</option><option value="document">Tài liệu</option><option value="guide">Hướng dẫn</option></>}</select><select value={levelOrPriority} onChange={event => setLevelOrPriority(event.target.value)}><option value="">-- {wiki ? 'Mức độ' : 'Mức độ'} --</option>{wiki ? <><option value="Immediate">Immediate</option><option value="High">High</option><option value="Normal">Normal</option><option value="Low">Low</option></> : <><option value="0">Thường</option><option value="1">Quan trọng</option><option value="2">Khẩn cấp</option></>}</select><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm kiếm..." /></div><div className="toolbar-actions"><button type="button" className="btn btn-tools" onClick={() => void load()} disabled={loading}>Làm mới</button><button type="button" className="btn btn-success" disabled title="CRUD sẽ mở sau khi target API và permission được phê duyệt.">Thêm mới</button></div></div></div>
    {error && <p className="error">{error}</p>}
    <div className="knowledge-card"><div className="table-scroll-x"><table className="data-table knowledge-table"><thead>{wiki ? <tr><th>ID</th><th>Phân loại</th><th>Sản phẩm</th><th>Nghiệp vụ / CTCK</th><th>Tiêu đề</th><th>Vấn đề / Lỗi</th><th>Cách check / thực hiện</th><th>Phương án xử lý</th><th>Mức độ</th><th>Trạng thái</th></tr> : <tr><th>ID</th><th>📌</th><th>Phân loại</th><th>Mức độ</th><th>Tiêu đề</th><th>Loại</th><th>Phạm vi</th><th>Ngày xuất bản</th><th>Hết hạn</th><th>Người tạo</th><th>Trạng thái</th></tr>}</thead><tbody>{loading ? <tr><td colSpan={wiki ? 10 : 11} className="knowledge-empty">Đang tải dữ liệu...</td></tr> : items.length === 0 ? <tr><td colSpan={wiki ? 10 : 11} className="knowledge-empty">{legacyMode ? 'Không có dữ liệu' : 'Target chưa có nguồn dữ liệu'}</td></tr> : wiki ? wikiItems.map(item => <tr key={item.id}><td>{item.id}</td><td><span className="content-badge">{badgeLabel('wiki', item.category)}</span></td><td>{item.product || '—'}</td><td>{item.category === 'business' ? item.business_area || '—' : item.client || '—'}</td><td><button type="button" className="content-title-link" onClick={() => setSelected(item)}>{item.title || '—'}</button></td><td>{item.root_cause || '—'}</td><td>{item.diagnosis || '—'}</td><td>{item.solution || '—'}</td><td>{item.level || '—'}</td><td><span className="content-status">{statusLabel(item.status)}</span></td></tr>) : announcementItems.map(item => <tr key={item.id}><td>{item.id}</td><td>{item.is_pinned ? '📌' : ''}</td><td>{badgeLabel('announcements', item.category)}</td><td>{item.priority === 2 ? 'Khẩn cấp' : item.priority === 1 ? 'Quan trọng' : 'Thường'}</td><td><button type="button" className="content-title-link" onClick={() => setSelected(item)}>{item.title || '—'}</button></td><td>{item.content_type || '—'}</td><td>{item.is_public ? 'Tất cả' : 'Giới hạn'}</td><td>{formatDate(item.publish_date)}</td><td>{formatDate(item.expire_date)}</td><td>{item.created_by || '—'}</td><td><span className="content-status">{statusLabel(item.status)}</span></td></tr>)}</tbody></table></div><div className="knowledge-footer">Tổng cộng ({items.length} bản ghi) · Read-only trong giai đoạn chuyển đổi</div></div>
    {selected && <div className="content-detail-modal" role="dialog" aria-modal="true"><button type="button" className="content-modal-backdrop" aria-label="Đóng" onClick={() => setSelected(null)} /><article><header><h2>{selected.title || 'Chi tiết'}</h2><button type="button" onClick={() => setSelected(null)} aria-label="Đóng">×</button></header><div className="content-detail-body">{'root_cause' in selected ? <><p><strong>Phân loại:</strong> {badgeLabel('wiki', selected.category)}</p><p><strong>Sản phẩm:</strong> {selected.product || '—'}</p><p><strong>Nguyên nhân:</strong> {selected.root_cause || '—'}</p><p><strong>Cách check:</strong> {selected.diagnosis || '—'}</p><p><strong>Phương án xử lý:</strong> {selected.solution || '—'}</p></> : <><p><strong>Phân loại:</strong> {badgeLabel('announcements', selected.category)}</p><p><strong>Mức độ:</strong> {selected.priority === 2 ? 'Khẩn cấp' : selected.priority === 1 ? 'Quan trọng' : 'Thường'}</p><p><strong>Phạm vi:</strong> {selected.is_public ? 'Tất cả' : 'Giới hạn'}</p><p><strong>Ngày xuất bản:</strong> {formatDate(selected.publish_date)}</p></>}</div><footer>Read-only từ Jarvis legacy.</footer></article></div>}
  </section>;
}
