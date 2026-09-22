import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiAlertCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

import ParentPagination from "../../components/parents/ParentPagination";
import ParentTable from "../../components/parents/ParentTable";
import {
  deleteParent,
  getParents,
} from "../../services/parentService";

function ParentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const {
    data: parentsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["parents", "list", page, searchKeyword],
    queryFn: () =>
      getParents({
        page,
        limit: 10,
        search: searchKeyword,
      }),
    keepPreviousData: true,
  });

  const parents = Array.isArray(parentsData?.data)
    ? parentsData.data
    : [];

  const total = Number(parentsData?.totalRecords || 0);
  const totalPages = Number(parentsData?.totalPages || 1);

  const isSearching = searchKeyword.trim().length > 0;

  const deleteMutation = useMutation({
    mutationFn: deleteParent,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["parents"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "stats"],
      });
    },
  });

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

  const handleEdit = (parent) => {
    navigate(`/admin/parents/${parent._id}/edit`);
  };

  const handleDelete = (parent) => {
    const parentName = parent.fatherName || parent.motherName || "this parent";

    const confirmed = window.confirm(
      `Are you sure you want to delete the parent record for ${parentName}?\n\nThe parent will be moved to deleted records and can be restored later.`
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(parent._id);
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
            Parents
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage parent accounts and their linked students.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/admin/parents/deleted"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FiTrash2 size={17} />
            Deleted Parents
          </Link>

          <Link
            to="/admin/parents/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <FiPlus size={17} />
            Add Parent
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Parent Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {isSearching
                ? `${total} search result${total === 1 ? "" : "s"}`
                : `${total} registered parent${total === 1 ? "" : "s"}`}
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
                placeholder="Search parent, email or mobile"
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

        {deleteMutation.isError ? (
          <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <FiAlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="font-semibold text-red-800">
                  Unable to delete parent
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {deleteMutation.error?.response?.data?.message ||
                    deleteMutation.error?.message ||
                    "Something went wrong while deleting the parent."}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {isError ? (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <FiAlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="font-semibold text-red-800">
                  Unable to load parents
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

        {!isError ? (
          <ParentTable
            parents={parents}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deleteMutation.isPending ? deleteMutation.variables : null}
          />
        ) : null}

        {!isError && totalPages > 1 ? (
          <ParentPagination
            page={Number(parentsData?.page || page)}
            pages={totalPages}
            total={total}
            limit={Number(parentsData?.limit || 10)}
            onPageChange={setPage}
            disabled={isFetching}
          />
        ) : null}
      </section>
    </div>
  );
}

export default ParentsPage;
