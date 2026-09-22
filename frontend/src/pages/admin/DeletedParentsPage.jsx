import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiArrowLeft, FiRefreshCw, FiRotateCcw, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import ParentPagination from "../../components/parents/ParentPagination"; // Adjust path if needed based on your structure
import {
  getDeletedParents,
  restoreParent,
} from "../../services/parentService";

const LIMIT = 10;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStudentName = (student) => {
  if (!student) return "";

  if (typeof student === "string") return student;

  return (
    [student.firstName, student.lastName].filter(Boolean).join(" ") ||
    student.admissionNo ||
    ""
  );
};

const getStudentDetails = (student) => {
  if (!student || typeof student === "string") return "";

  const details = [
    student.admissionNo,
    student.className && student.section
      ? `${student.className} • ${student.section}`
      : student.className || student.section,
  ].filter(Boolean);

  return details.join(" • ");
};

export default function DeletedParentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const deletedParentsQuery = useQuery({
    queryKey: ["parents", "deleted", page, searchKeyword],
    queryFn: () =>
      getDeletedParents({
        page,
        limit: LIMIT,
        search: searchKeyword,
      }),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreParent,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["parents"],
      });

      queryClient.invalidateQueries({
        queryKey: ["dashboard", "stats"],
      });
    },
  });

  const parentsData = deletedParentsQuery.data;

  const parents = Array.isArray(parentsData?.parents)
    ? parentsData.parents
    : [];
  const total = Number(parentsData?.total || 0);
  const totalPages = Number(parentsData?.totalPages || 1);

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

  const handleRestore = (parentId) => {
    if (
      window.confirm(
        "Are you sure you want to restore this parent?"
      )
    ) {
      restoreMutation.mutate(parentId);
    }
  };

  const handleRefresh = () => {
    deletedParentsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <FiUser className="text-3xl text-gray-800" />

            <h1 className="text-2xl font-bold text-gray-900">
              Deleted Parents
            </h1>
          </div>

          <p className="text-sm text-gray-500">
            Restore parents that were previously deleted.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/parents")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <FiArrowLeft />
          Back to Parents
        </button>
      </div>

      {/* Deleted Parent Records */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Card Header & Search Bar */}
        <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Deleted Parent Records
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {total} deleted {total === 1 ? "parent" : "parents"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search deleted parents..."
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-gray-800 focus:outline-none"
              />

              <button
                type="submit"
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Search
              </button>

              {searchKeyword && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={deletedParentsQuery.isFetching}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                className={
                  deletedParentsQuery.isFetching
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {deletedParentsQuery.isLoading && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">
              Loading deleted parents...
            </p>
          </div>
        )}

        {/* Error */}
        {deletedParentsQuery.isError && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-red-600">
              Failed to load deleted parents.
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 text-sm font-medium text-gray-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!deletedParentsQuery.isLoading &&
          !deletedParentsQuery.isError &&
          parents.length === 0 && (
            <div className="px-6 py-12 text-center">
              <FiUser className="mx-auto text-4xl text-gray-300" />

              <p className="mt-3 text-sm font-medium text-gray-700">
                No deleted parents found.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {searchKeyword
                  ? "No deleted parents match your search criteria."
                  : "Deleted parent records will appear here."}
              </p>
            </div>
          )}

        {/* Parent List */}
        {!deletedParentsQuery.isLoading &&
          !deletedParentsQuery.isError &&
          parents.length > 0 && (
            <div className="divide-y divide-gray-200">
              {parents.map((parent) => {
                const studentName = getStudentName(parent.student);
                const studentDetails = getStudentDetails(
                  parent.student
                );

                return (
                  <div
                    key={parent._id}
                    className="flex items-center gap-4 px-5 py-5 transition hover:bg-gray-50"
                  >
                    {/* Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <FiUser className="text-xl text-gray-400" />
                    </div>

                    {/* Parent Information */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-gray-900">
                        {parent.fatherName || "—"}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Mother:{" "}
                        <span className="font-medium text-gray-600">
                          {parent.motherName || "—"}
                        </span>
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                        <span>{parent.mobile || "—"}</span>

                        {parent.email && (
                          <>
                            <span>•</span>
                            <span className="truncate">
                              {parent.email}
                            </span>
                          </>
                        )}
                      </div>

                      {studentName && (
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-gray-500">
                          <span>
                            Student:{" "}
                            <span className="font-medium">
                              {studentName}
                            </span>
                          </span>

                          {studentDetails && (
                            <>
                              <span>•</span>
                              <span>{studentDetails}</span>
                            </>
                          )}
                        </div>
                      )}

                      <p className="mt-1 text-xs text-gray-400">
                        Deleted on {formatDate(parent.deletedAt)}
                      </p>
                    </div>

                    {/* Restore */}
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleRestore(parent._id)
                        }
                        disabled={restoreMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiRotateCcw />
                        Restore
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {/* Pagination Component */}
        {!deletedParentsQuery.isLoading &&
          !deletedParentsQuery.isError &&
          totalPages > 1 && (
            <div className="border-t border-gray-200 px-5 py-4">
              <ParentPagination
                page={page}
                pages={totalPages}
                total={total}
                limit={LIMIT}
                onPageChange={setPage}
                disabled={deletedParentsQuery.isLoading}
              />
            </div>
          )}
      </div>

      {/* Restore Error */}
      {restoreMutation.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to restore the parent. Please try again.
        </div>
      )}
    </div>
  );
}