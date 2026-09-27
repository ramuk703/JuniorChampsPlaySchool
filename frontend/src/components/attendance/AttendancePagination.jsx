import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function AttendancePagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  isFetching = false,
}) {
  if (!total || totalPages <= 1) {
    return null;
  }

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Showing{" "}
        <span className="font-semibold text-slate-900">{startItem}</span>{" "}
        to{" "}
        <span className="font-semibold text-slate-900">{endItem}</span>{" "}
        of{" "}
        <span className="font-semibold text-slate-900">{total}</span>{" "}
        records
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious || isFetching}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiChevronLeft />
          Previous
        </button>

        <span className="px-2 text-sm text-slate-600">
          Page{" "}
          <span className="font-semibold text-slate-900">{page}</span> of{" "}
          <span className="font-semibold text-slate-900">{totalPages}</span>
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext || isFetching}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}

export default AttendancePagination;
