import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiAlertCircle, FiPlus, FiRefreshCw } from "react-icons/fi";

import { getTeacherAttendance } from "../../services/teacherAttendanceService";
import MarkTeacherAttendanceForm from "../../components/teacherAttendance/MarkTeacherAttendanceForm";
import TeacherAttendanceTable from "../../components/teacherAttendance/TeacherAttendanceTable";

function TeacherAttendancePage() {
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const {
    data: attendanceData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["teacher-attendance"],
    queryFn: getTeacherAttendance,
  });

  const records = attendanceData?.data || [];

  const handleFormSuccess = () => {
    setSuccessMessage("Teacher attendance marked successfully.");
    setShowForm(false);
  };

  const handleRefresh = async () => {
    setSuccessMessage("");
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Teacher Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Record and review teacher attendance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setSuccessMessage("");
              setShowForm((current) => !current);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <FiPlus className="h-4 w-4" />
            {showForm ? "Close Form" : "Mark Attendance"}
          </button>
        </div>
      </div>

      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {showForm ? (
        <MarkTeacherAttendanceForm onSuccess={handleFormSuccess} />
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load teacher attendance
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error?.response?.data?.message ||
                  "Something went wrong while loading attendance records."}
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Attendance Records
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {attendanceData?.count ?? records.length} attendance record
                  {(attendanceData?.count ?? records.length) === 1
                    ? ""
                    : "s"}
                  .
                </p>
              </div>

              {isFetching ? (
                <span className="text-xs font-medium text-slate-400">
                  Updating...
                </span>
              ) : null}
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <FiRefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
              <p className="mt-3 text-sm text-slate-500">
                Loading attendance records...
              </p>
            </div>
          ) : (
            <TeacherAttendanceTable records={records} />
          )}
        </>
      )}
    </div>
  );
}

export default TeacherAttendancePage;
