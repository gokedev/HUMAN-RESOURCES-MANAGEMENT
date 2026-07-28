interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, totalElements, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        Page {currentPage + 1} of {totalPages} ({totalElements} total)
      </span>
      <div className="pagination-controls">
        <button
          className="btn btn-sm btn-outline-secondary"
          type="button"
          disabled={currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          type="button"
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
