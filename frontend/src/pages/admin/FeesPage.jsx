import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiAlertCircle, FiPlus, FiRefreshCw } from "react-icons/fi";

import {
  getFees,
  markFeePaid,
} from "../../services/feeService";
import GenerateFeeForm from "../../components/fees/GenerateFeeForm";
import FeePagination from "../../components/fees/FeePagination";
import FeeTable from "../../components/fees/FeeTable";

function FeesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const limit = 20;

  const {
    data: feesData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fees", page, limit],
    queryFn: () => getFees({ page, limit }),
    keepPreviousData: true,
  });

  const markPaidMutation = useMutation({
    mutationFn: (paymentId) => markFeePaid(paymentId),
    onSuccess: async () => {
      setSuccessMessage("Fee marked as paid successfully.");

      await queryClient.invalidateQueries({
        queryKey: ["fees"],
      });
    },
  });

  const payments = feesData?.payments || [];
  const total = feesData?.total || 0;
  const totalPages = feesData?.totalPages || 1;

  const handleGenerateSuccess = () => {
    setShowGenerateForm(false);
    setPage(1);
    setSuccessMessage("Fee generated successfully.");
  };

  const handleMarkPaid = (payment) => {
    if (!payment?._id || markPaidMutation.isPending) {
      return;
    }

    const studentName = payment.student
      ? `${payment.student.firstName || ""} ${
          payment.student.lastName || ""
        }`.trim()
      : "this student";

    const confirmed = window.confirm(
      `Mark the fee for ${studentName || "this student"} as paid?`,
    );

    if (!confirmed) {
      return;
    }

    setSuccessMessage("");
    markPaidMutation.mutate(payment._id);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    setPage(nextPage);
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
            Fee Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate, review, and manage student fee payments.
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
              setShowGenerateForm((current) => !current);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <FiPlus className="h-4 w-4" />
            {showGenerateForm ? "Close Form" : "Generate Fee"}
          </button>
        </div>
      </div>

      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {markPaidMutation.isError ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {markPaidMutation.error?.response?.data?.message ||
              "Unable to mark fee as paid. Please try again."}
          </span>
        </div>
      ) : null}

      {showGenerateForm ? (
        <GenerateFeeForm onSuccess={handleGenerateSuccess} />
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load fees
              </h2>
              <p className="mt-1 text-sm text-red-700">
                {error?.response?.data?.message ||
                  "Something went wrong while loading fee records."}
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
                  Fee Payments
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {total} total fee record{total === 1 ? "" : "s"}.
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
                Loading fee records...
              </p>
            </div>
          ) : (
            <>
              <FeeTable
                payments={payments}
                onMarkPaid={handleMarkPaid}
                isMarkingPaid={markPaidMutation.isPending}
              />

              <FeePagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default FeesPage;
