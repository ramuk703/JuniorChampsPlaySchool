import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";

import TeacherPagination from "../../components/teachers/TeacherPagination";
import TeacherTable from "../../components/teachers/TeacherTable";
import {
  deleteTeacher,
  getTeachers,
} from "../../services/teacherService";

const TeachersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [limit] = useState(10);

  const teachersQuery = useQuery({
    queryKey: ["teachers", { page, limit, search }],
    queryFn: () =>
      getTeachers({
        page,
        limit,
        search,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (teacherId) => deleteTeacher(teacherId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "stats"],
      });
    },
  });

  const teachers = teachersQuery.data?.data || [];

  const pagination = {
    page: teachersQuery.data?.page || page,
    pages: teachersQuery.data?.totalPages || 1,
    total: teachersQuery.data?.totalRecords || 0,
    limit: teachersQuery.data?.limit || limit,
  };

  const handleSearch = (event) => {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleEdit = (teacher) => {
    navigate(`/admin/teachers/${teacher._id}/edit`);
  };

  const handleDelete = (teacher) => {
    const fullName = [teacher.firstName, teacher.lastName]
      .filter(Boolean)
      .join(" ");

    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        fullName || "this teacher"
      }?\n\nThe teacher will be moved to deleted records and can be restored later.`,
    );

    if (!confirmed) return;

    deleteMutation.mutate(teacher._id);
  };

  const handleRefresh = async () => {
    await teachersQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Staff Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Teachers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage teachers, contact information, assignments, and status.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/admin/teachers/deleted"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FiTrash2 size={17} />
            Deleted Teachers
          </Link>

          <Link
            to="/admin/teachers/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <FiPlus size={17} />
            Add Teacher
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 md:flex-row"
        >
          <div className="relative flex-1">
            <FiSearch
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, employee ID, email, or mobile..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Search
          </button>

          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={teachersQuery.isFetching}
            title="Refresh teachers"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              size={17}
              className={teachersQuery.isFetching ? "animate-spin" : ""}
            />
          </button>
        </form>
      </div>

      {deleteMutation.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {deleteMutation.error?.response?.data?.message ||
            "Unable to delete teacher. Please try again."}
        </div>
      )}

      {teachersQuery.isLoading ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        </div>
      ) : teachersQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="font-semibold text-red-700">
            Unable to load teachers
          </p>

          <p className="mt-1 text-sm text-red-600">
            {teachersQuery.error?.response?.data?.message ||
              "Something went wrong while loading teacher records."}
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <FiRefreshCw size={16} />
            Try Again
          </button>
        </div>
      ) : (
        <>
          <TeacherTable
            teachers={teachers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
          />

          <TeacherPagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default TeachersPage;