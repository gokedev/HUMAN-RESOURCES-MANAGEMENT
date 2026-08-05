import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
    return (
        <div className={`search-input-wrap ${className}`}>
            <Search size={15} className="search-input-icon" aria-hidden="true" />
            <input
                className="form-control search-input"
                type="search"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

const variantClass = {
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info',
    secondary: 'badge-secondary',
};
export function Badge({ variant, children }) {
    return <span className={`badge ${variantClass[variant]}`}>{children}</span>;
}
const statusVariantMap = {
    ACTIVE: 'success',
    PENDING: 'warning',
    SUSPENDED: 'danger',
    PRESENT: 'success',
    ABSENT: 'danger',
    HALF_DAY: 'warning',
    ON_LEAVE: 'info',
    APPROVED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'secondary',
};
export function StatusBadge({ status }) {
    const variant = statusVariantMap[status] ?? 'secondary';
    return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
    return (<header className="page-header">
      <div>
        {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>);
}

export function Pagination({ currentPage, totalPages, totalElements, onPageChange }) {
    if (totalPages <= 1)
        return null;
    return (<div className="pagination-bar">
      <span className="pagination-info">
        Page {currentPage + 1} of {totalPages} ({totalElements} total)
      </span>
      <div className="pagination-controls">
        <button className="btn btn-sm btn-outline-secondary" type="button" disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)}>
          Previous
        </button>
        <button className="btn btn-sm btn-outline-secondary" type="button" disabled={currentPage >= totalPages - 1} onClick={() => onPageChange(currentPage + 1)}>
          Next
        </button>
      </div>
    </div>);
}

export function Modal({ title, onClose, children, footer }) {
    const dialogRef = useRef(null);
    useEffect(() => {
        const el = dialogRef.current;
        if (el && !el.open) {
            el.showModal();
        }
    }, []);
    function handleBackdropClick(e) {
        if (e.target === dialogRef.current) {
            onClose();
        }
    }
    return (<dialog ref={dialogRef} className="app-modal" onClose={onClose} onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={16}/>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </dialog>);
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', variant = 'danger', onConfirm, onClose, isProcessing = false, }) {
    return (<Modal title={title} onClose={onClose} footer={<>
          <button className="btn btn-outline-secondary" type="button" onClick={onClose} disabled={isProcessing}>
            Cancel
          </button>
          <button className={`btn btn-${variant}`} type="button" onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? <span className="spinner-border spinner-border-sm" aria-hidden="true"/> : null}
            {confirmLabel}
          </button>
        </>}>
      <p>{message}</p>
    </Modal>);
}

export function TabbedPage({ tabs, defaultTab, renderContent }) {
    const [activeId, setActiveId] = useState(defaultTab ?? tabs[0]?.id);
    const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
    return (
        <div className="tabbed-page">
            <ul className="nav nav-tabs" role="tablist" aria-label="Page sections">
                {tabs.map((tab) => (
                    <li className="nav-item" role="presentation" key={tab.id}>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={active.id === tab.id}
                            className={`nav-link ${active.id === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveId(tab.id)}
                        >
                            {tab.label}
                        </button>
                    </li>
                ))}
            </ul>
            <div className="tabbed-page-body">{renderContent(active.id)}</div>
        </div>
    );
}
