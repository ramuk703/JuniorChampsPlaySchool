import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FiArrowLeft, FiRefreshCw, FiRotateCcw, FiTrash2, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import TeacherPagination from "../../components/teachers/TeacherPagination"; // Assuming path is correct or adjust based on your structure
import {
  getDeletedTeachers,
  restoreTeacher,
} from "../../services/teacherService";

const getPhotoUrl = (photo) => {
  if (!photo) return "";

  if (
    photo.startsWith("http://") ||
    photo.startsWith("https://") ||
    photo.startsWith("blob:")
  ) {
    return photo;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const backendUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

  return `${backendUrl}/${photo.replace(/^\/+/, "")}`;
};

const formatDeletedDate = (date) => {
  if (!date) return "Unknown date";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const DeletedTeachersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const LIMIT = 10;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["teachers", "deleted", page, searchKeyword],
    queryFn: () =>
      getDeletedTeachers({
        page,
        limit: LIMIT,
        search: searchKeyword,
      }),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreTeacher,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["teachers", "deleted"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "stats"],
      });
    },
  });

  const teachers = Array.isArray(data?.teachers) ? data.teachers : [];
  const total = Number(data?.total || 0);
  const totalPages = Number(data?.totalPages || 1);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchKeyword(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchKeyword("");
    setPage(1);
  };

  const handleRestore = async (teacher) => {
    const confirmed = window.confirm(
      `Are you sure you want to restore ${teacher.firstName} ${teacher.lastName}?`
    );

    if (!confirmed) return;

    try {
      await restoreMutation.mutateAsync(teacher._id);
    } catch (restoreError) {
      console.error("Failed to restore teacher:", restoreError);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-1 text-sm font-medium text-slate-500">
          Administration
        </div>

        {/* Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <FiTrash2 className="h-7 w-7 text-slate-800" />

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Deleted Teachers
              </h1>
            </div>

            <p className="mt-2 text-base text-slate-500">
              Restore teachers that were previously deleted.
            </p>
          </div>

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate("/admin/teachers")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Teachers
          </button>
        </div>

        {/* Main Card */}
        <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Card Header & Search Form */}
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Deleted Teacher Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {total} deleted {total === 1 ? "teacher" : "teachers"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search deleted teachers..."
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-800 focus:outline-none"
                />

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Search
                </button>

                {searchKeyword && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Clear
                  </button>
                )}
              </form>

              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiRefreshCw
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />

              <p className="mt-4 text-sm text-slate-500">
                Loading deleted teachers...
              </p>
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-5">
                <p className="font-semibold text-red-700">
                  Failed to load deleted teachers
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error?.response?.data?.message ||
                    error?.message ||
                    "Something went wrong."}
                </p>

                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && teachers.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <FiTrash2 className="h-7 w-7 text-slate-400" />
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No deleted teachers
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {searchKeyword
                  ? "No deleted teachers found matching your search."
                  : "There are currently no deleted teacher records."}
              </p>
            </div>
          )}

          {/* Teacher Records */}
          {!isLoading && !isError && teachers.length > 0 && (
            <div>
              {teachers.map((teacher) => {
                const fullName =
                  [teacher.firstName, teacher.lastName]
                    .filter(Boolean)
                    .join(" ") || "Unnamed Teacher";

                const photoUrl = getPhotoUrl(teacher.photo);

                return (
                  <div
                    key={teacher._id}
                    className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* Teacher Information */}
                    <div className="flex min-w-0 items-center gap-4">
                      {/* Avatar */}
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-100">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <FiUser className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                          {fullName}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {teacher.employeeId || "No Employee ID"}
                          <span className="mx-1.5">•</span>
                          {teacher.qualification || "No qualification"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Deleted on {formatDeletedDate(teacher.deletedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Restore */}
                    <button
                      type="button"
                      onClick={() => handleRestore(teacher)}
                      disabled={restoreMutation.isPending}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FiRotateCcw className="h-4 w-4" />

                      {restoreMutation.isPending
                        ? "Restoring..."
                        : "Restore"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !isError && totalPages > 1 && (
            <div className="border-t border-slate-200 px-5 py-4">
              <TeacherPagination
                page={page}
                pages={totalPages}
                total={total}
                limit={LIMIT}
                onPageChange={setPage}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Restore Error */}
          {restoreMutation.isError && (
            <div className="border-t border-red-100 bg-red-50 px-5 py-3">
              <p className="text-sm font-medium text-red-700">
                {restoreMutation.error?.response?.data?.message ||
                  restoreMutation.error?.message ||
                  "Failed to restore teacher."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeletedTeachersPage;