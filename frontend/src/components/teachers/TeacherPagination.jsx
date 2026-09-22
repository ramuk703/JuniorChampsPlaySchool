import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const TeacherPagination = ({
  page = 1,
  pages = 1,
  total = 0,
  limit = 10,
  onPageChange,
}) => {
  if (pages <= 1) {
    return null;
  }

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700">
          {start}-{end}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-slate-700">{total}</span>{" "}
        teachers
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Previous page"
        >
          <FiChevronLeft size={17} />
        </button>

        <span className="min-w-20 text-center text-sm font-semibold text-slate-700">
          Page {page} of {pages}
        </span>

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="Next page"
        >
          <FiChevronRight size={17} />
        </button>
      </div>
    </div>
  );
};

export default TeacherPagination;
