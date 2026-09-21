import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiRefreshCw,
  FiRotateCcw,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { Link } from "react-router-dom";

import {
  getDeletedStudents,
  restoreStudent,
} from "../../services/studentService";

function formatDeletedDate(date) {
  if (!date) {
    return "Unknown date";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DeletedStudentsPage() {
  const queryClient = useQueryClient();

  const {
    data: deletedData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["students", "deleted"],
    queryFn: getDeletedStudents,
  });

  const restoreMutation = useMutation({
    mutationFn: (studentId) => restoreStudent(studentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["students"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "stats"],
      });
    },
  });

  const students = deletedData?.students || (
    Array.isArray(deletedData) ? deletedData : []
  );

  const handleRestore = (student) => {
    const fullName = [
      student.firstName,
      student.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const confirmed = window.confirm(
      `Are you sure you want to restore ${fullName || "this student"}?`
    );

    if (!confirmed) {
      return;
    }

    restoreMutation.mutate(student._id);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <FiTrash2 size={27} />
            Deleted Students
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Restore students that were previously deleted.
          </p>
        </div>

        <Link
          to="/admin/students"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <FiArrowLeft size={17} />
          Back to Students
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="font-semibold text-slate-900">
              Deleted Student Records
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {students.length} deleted student
              {students.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              size={15}
              className={isFetching ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {isError ? (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <FiAlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="font-semibold text-red-800">
                  Unable to load deleted students
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error?.response?.data?.message ||
                    error?.message ||
                    "Something went wrong."}
                </p>

                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <FiRefreshCw size={15} />
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />

                <div className="min-w-0 flex-1">
                  <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-56 animate-pulse rounded bg-slate-100" />
                </div>

                <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && !isError && students.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {students.map((student) => {
              const fullName = [
                student.firstName,
                student.lastName,
              ]
                .filter(Boolean)
                .join(" ");

              const isRestoring =
                restoreMutation.isPending &&
                restoreMutation.variables === student._id;

              return (
                <div
                  key={student._id}
                  className="flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <FiUser size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {fullName || "Unnamed Student"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {student.admissionNo || "No admission number"}
                      {student.className
                        ? ` • ${student.className}`
                        : ""}
                      {student.section
                        ? `-${student.section}`
                        : ""}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Deleted on {formatDeletedDate(student.deletedAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestore(student)}
                    disabled={restoreMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiRotateCcw
                      size={16}
                      className={isRestoring ? "animate-spin" : ""}
                    />
                    {isRestoring ? "Restoring..." : "Restore"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        {!isLoading && !isError && students.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FiTrash2
              className="mx-auto text-slate-300"
              size={32}
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No deleted students
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Deleted student records will appear here.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default DeletedStudentsPage;
