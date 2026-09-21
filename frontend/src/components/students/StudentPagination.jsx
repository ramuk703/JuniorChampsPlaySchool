import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function StudentPagination({
  page,
  total,
  limit,
  onPageChange,
  disabled = false,
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-medium text-slate-700">
          {start}
        </span>{" "}
        to{" "}
        <span className="font-medium text-slate-700">
          {end}
        </span>{" "}
        of{" "}
        <span className="font-medium text-slate-700">
          {total}
        </span>{" "}
        students
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiChevronLeft size={16} />
          Previous
        </button>

        <span className="px-2 text-sm text-slate-500">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default StudentPagination;
