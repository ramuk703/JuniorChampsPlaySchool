import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiAlertCircle,
  FiCalendar,
  FiRefreshCw,
} from "react-icons/fi";

import AttendanceFilters from "../../components/attendance/AttendanceFilters";
import MarkAttendanceForm from "../../components/attendance/MarkAttendanceForm";
import AttendancePagination from "../../components/attendance/AttendancePagination";
import AttendanceStats from "../../components/attendance/AttendanceStats";
import AttendanceTable from "../../components/attendance/AttendanceTable";

import {
  getAttendance,
  getAttendanceStats,
} from "../../services/attendanceService";

const initialFilters = {
  date: "",
  className: "",
  status: "",
};

function AttendancePage() {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      date: appliedFilters.date,
      className: appliedFilters.className,
      status: appliedFilters.status,
    }),
    [page, appliedFilters],
  );

  const {
    data: attendanceData,
    isLoading: isAttendanceLoading,
    isFetching: isAttendanceFetching,
    isError: isAttendanceError,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ["attendance", "list", queryParams],
    queryFn: () => getAttendance(queryParams),
    keepPreviousData: true,
  });

  const {
    data: statsData,
    isLoading: isStatsLoading,
    isError: isStatsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["attendance", "stats"],
    queryFn: getAttendanceStats,
  });

  const attendance = attendanceData?.attendance || [];
  const total = attendanceData?.total || 0;
  const totalPages = attendanceData?.totalPages || 1;

  const stats = statsData?.stats || statsData?.data || statsData || {};

  const handleFilterChange = (name, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({
      date: filters.date,
      className: filters.className.trim(),
      status: filters.status,
    });
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  };

  const handleRefresh = () => {
    refetchAttendance();
    refetchStats();
  };

  const errorMessage =
    attendanceError?.response?.data?.message ||
    attendanceError?.message ||
    "Failed to load attendance records.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-xl text-blue-600" />

            <h1 className="text-2xl font-bold text-slate-900">
              Attendance
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            View and manage student attendance records.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isAttendanceFetching || isStatsLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiRefreshCw
            className={
              isAttendanceFetching || isStatsLoading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      <AttendanceStats
        stats={stats}
        isLoading={isStatsLoading || isStatsError}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Mark Attendance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Record attendance for an individual student.
          </p>
        </div>

        <MarkAttendanceForm
          onSuccess={() => {
            refetchAttendance();
            refetchStats();
          }}
        />
      </div>

      <AttendanceFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        isFetching={isAttendanceFetching}
      />

      {isAttendanceError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="mt-0.5 shrink-0 text-xl text-red-600" />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load attendance
              </h2>

              <p className="mt-1 text-sm text-red-700">{errorMessage}</p>

              <button
                type="button"
                onClick={() => refetchAttendance()}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <FiRefreshCw />
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : isAttendanceLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FiRefreshCw className="mx-auto animate-spin text-2xl text-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading attendance records...
          </p>
        </div>
      ) : (
        <>
          <AttendanceTable attendance={attendance} />

          <AttendancePagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={attendanceData?.limit || 10}
            onPageChange={setPage}
            isFetching={isAttendanceFetching}
          />
        </>
      )}
    </div>
  );
}

export default AttendancePage;
