export default function DocumentsPage() {
  return (
    <div className="documents-page">
      <div className="page-header-wrapper">
        <div className="page-title-row">
          <h1 className="page-title">
            <span className="title-icon documents-title-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            Tài liệu <em className="documents-wip-label">[WIP]</em>
          </h1>
        </div>
      </div>
      <section className="documents-wip-card" aria-labelledby="documents-wip-title">
        <div className="documents-wip-body">
          <svg className="documents-wip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <h2 id="documents-wip-title">Tính năng đang phát triển</h2>
          <p>Module Tài liệu sẽ sớm được cập nhật. Vui lòng quay lại sau.</p>
        </div>
      </section>
    </div>
  );
}
