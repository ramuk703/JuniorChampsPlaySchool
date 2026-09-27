import { FiFilter, FiRefreshCw } from "react-icons/fi";

function AttendanceFilters({
  filters,
  onFilterChange,
  onApply,
  onReset,
  isFetching = false,
}) {
  const handleChange = (event) => {
    const { name, value } = event.target;

    onFilterChange(name, value);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <FiFilter className="text-slate-500" />

        <h2 className="text-sm font-semibold text-slate-900">
          Attendance Filters
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="attendance-date"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Date
          </label>

          <input
            id="attendance-date"
            name="date"
            type="date"
            value={filters.date}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="attendance-class"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Class
          </label>

          <input
            id="attendance-class"
            name="className"
            type="text"
            value={filters.className}
            onChange={handleChange}
            placeholder="e.g. Nursery"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="attendance-status"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Status
          </label>

          <select
            id="attendance-status"
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={isFetching}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiFilter />
            Apply
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={isFetching}
            title="Reset filters"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>
    </form>
  );
}

export default AttendanceFilters;
