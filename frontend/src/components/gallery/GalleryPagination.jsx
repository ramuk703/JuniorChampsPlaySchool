import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function GalleryPagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
  disabled = false,
}) {
  if (!pages || pages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Showing {start}-{end} of {total} galleries
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiChevronLeft size={16} />
          Previous
        </button>

        <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
          {page} / {pages}
        </span>

        <button
          type="button"
          disabled={disabled || page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default GalleryPagination;
