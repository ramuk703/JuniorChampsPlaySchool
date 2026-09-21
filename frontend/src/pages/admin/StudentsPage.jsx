import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiAlertCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUsers,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

import StudentPagination from "../../components/students/StudentPagination";
import StudentTable from "../../components/students/StudentTable";
import {
  deleteStudent,
  getStudents,
  searchStudents,
} from "../../services/studentService";

function StudentsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const isSearching = searchKeyword.trim().length > 0;

  const {
    data: studentsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["students", "list", page, searchKeyword],
    queryFn: () =>
      isSearching
        ? searchStudents(searchKeyword.trim())
        : getStudents({
            page,
            limit: 10,
          }),
  });

  const students = studentsData?.students || (
    Array.isArray(studentsData) ? studentsData : []
  );

  const total = isSearching
    ? students.length
    : studentsData?.total || 0;

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setPage(1);
    setSearchKeyword(search.trim());
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchKeyword("");
    setPage(1);
  };

  const handleEdit = (student) => {
    navigate(`/admin/students/${student._id}/edit`);
  };

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (studentId) => deleteStudent(studentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["students"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "stats"],
      });
    },
  });

  const handleDelete = (student) => {
    const fullName = [
      student.firstName,
      student.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const confirmed = window.confirm(
      `Are you sure you want to delete ${fullName || "this student"}?\n\nThe student will be moved to the deleted records and can be restored later.`
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(student._id);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <FiUsers size={27} />
            Students
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage registered students and their information.
          </p>
        </div>

        <Link
          to="/admin/students/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <FiPlus size={17} />
          Add Student
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Student Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {isSearching
                ? `${students.length} search result${
                    students.length === 1 ? "" : "s"
                  }`
                : `${total} registered student${
                    total === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full gap-2 lg:max-w-md"
          >
            <div className="relative min-w-0 flex-1">
              <FiSearch
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or admission no."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Search
            </button>

            {isSearching ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
            ) : null}
          </form>
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
                  Unable to load students
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

        <StudentTable
          students={students}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {!isSearching && !isError ? (
          <StudentPagination
            page={page}
            total={total}
            limit={10}
            onPageChange={setPage}
            disabled={isFetching}
          />
        ) : null}
      </section>
    </div>
  );
}

export default StudentsPage;