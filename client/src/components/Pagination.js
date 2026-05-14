import React from 'react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, padding: '12px 0' }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(1)}
        disabled={page === 1}
      >
        &laquo;
      </button>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        &lsaquo;
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        &rsaquo;
      </button>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
      >
        &raquo;
      </button>
      <span style={{ color: '#64748b', fontSize: 13, marginLeft: 8 }}>
        Page {page} of {totalPages}
      </span>
    </div>
  );
}
