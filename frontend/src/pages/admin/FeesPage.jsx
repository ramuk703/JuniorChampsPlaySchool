import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiAlertCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";

import { getFees, markFeePaid } from "../../services/feeService";
import { getStudents } from "../../services/studentService";
import GenerateFeeForm from "../../components/fees/GenerateFeeForm";
import FeePagination from "../../components/fees/FeePagination";
import FeeTable from "../../components/fees/FeeTable";
import RazorpayCheckout from "../../components/payments/RazorpayCheckout";

function FeesPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState("");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const limit = 10;

  // -------------------------------------------------------
  // Student search
  // -------------------------------------------------------

  const {
    data: studentSearchData,
    isLoading: studentSearchLoading,
  } = useQuery({
    queryKey: ["students", "fee-search", studentSearch],
    queryFn: () =>
      getStudents({
        page: 1,
        limit: 10,
        search: studentSearch,
      }),
    enabled: studentSearch.trim().length >= 2,
  });

  const searchedStudents = useMemo(
    () => studentSearchData?.students || [],
    [studentSearchData?.students],
  );

  // -------------------------------------------------------
  // Fee records
  // -------------------------------------------------------

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

  const payments = useMemo(
    () => feesData?.payments || [],
    [feesData?.payments],
  );
  const total = feesData?.total || 0;
  const totalPages = feesData?.totalPages || 1;

  // -------------------------------------------------------
  // When searching, create a student-based view.
  // This allows students with no FeePayment record to appear.
  // -------------------------------------------------------

  const displayedStudents = useMemo(() => {
    if (!studentSearch.trim()) {
      return [];
    }

    return searchedStudents.map((student) => {
      const existingPayment = payments.find(
        (payment) => payment.student?._id === student._id,
      );

      return {
        student,
        payment: existingPayment || null,
      };
    });
  }, [studentSearch, searchedStudents, payments]);

  // -------------------------------------------------------
  // Mark fee paid
  // -------------------------------------------------------

  const markPaidMutation = useMutation({
    mutationFn: (paymentId) => markFeePaid(paymentId),

    onSuccess: async () => {
      setSuccessMessage("Fee marked as paid successfully.");

      await queryClient.invalidateQueries({
        queryKey: ["fees"],
      });
    },
  });

  // -------------------------------------------------------
  // Search handlers
  // -------------------------------------------------------

  const handleStudentSearchChange = (event) => {
    const value = event.target.value;

    setStudentSearch(value);

    if (!value.trim()) {
      setPage(1);
    }
  };

  const clearStudentSearch = () => {
    setStudentSearch("");
    setPage(1);
  };

  // -------------------------------------------------------
  // Generate fee
  // -------------------------------------------------------

  const handleGenerateSuccess = async () => {
    setShowGenerateForm(false);
    setPage(1);
    setSuccessMessage("Fee generated successfully.");

    await queryClient.invalidateQueries({
      queryKey: ["fees"],
    });
  };

  const handleGenerateForStudent = () => {
    setSuccessMessage("");
    setPaymentError("");
    setShowGenerateForm(true);
  };

  // -------------------------------------------------------
  // Mark paid
  // -------------------------------------------------------

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
    setPaymentError("");

    markPaidMutation.mutate(payment._id);
  };

  // -------------------------------------------------------
  // Razorpay
  // -------------------------------------------------------

  const handlePaymentSuccess = async (paymentResult) => {
    setPaymentError("");

    setSuccessMessage(
      `Payment successful${
        paymentResult?.paymentId
          ? ` — Payment ID: ${paymentResult.paymentId}`
          : "."
      }`,
    );

    await queryClient.invalidateQueries({
      queryKey: ["fees"],
    });
  };

  const handlePaymentError = (message) => {
    setSuccessMessage("");
    setPaymentError(message || "Payment could not be completed.");
  };

  // -------------------------------------------------------
  // Pagination
  // -------------------------------------------------------

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    setPage(nextPage);
  };

  // -------------------------------------------------------
  // Refresh
  // -------------------------------------------------------

  const handleRefresh = async () => {
    setSuccessMessage("");
    setPaymentError("");

    await refetch();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
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
              className={`h-4 w-4 ${
                isFetching ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setSuccessMessage("");
              setPaymentError("");
              setShowGenerateForm((current) => !current);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <FiPlus className="h-4 w-4" />

            {showGenerateForm ? "Close Form" : "Generate Fee"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {paymentError ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>{paymentError}</span>
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

      {/* Generate Fee */}
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
          {/* Student Search */}
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Fee Payments
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {studentSearch.trim()
                    ? "Search results are shown below."
                    : `${total} total fee record${
                        total === 1 ? "" : "s"
                      }.`}
                </p>
              </div>

              <div className="relative w-full sm:max-w-xl">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={studentSearch}
                  onChange={handleStudentSearchChange}
                  placeholder="Search student name or admission no..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                {studentSearch ? (
                  <button
                    type="button"
                    onClick={clearStudentSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Search Results */}
          {studentSearch.trim().length >= 2 ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              {studentSearchLoading ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Searching students...
                </div>
              ) : displayedStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Student
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Admission No.
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Class
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Fee
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Status
                        </th>

                        <th className="px-4 py-3 text-right font-semibold text-slate-600">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {displayedStudents.map(({ student, payment }) => {
                        const studentName =
                          `${student.firstName || ""} ${
                            student.lastName || ""
                          }`.trim() || "Unnamed Student";

                        return (
                          <tr
                            key={student._id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">
                                {studentName}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {student.admissionNo || "—"}
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {student.className || "—"}
                              {student.section
                                ? ` • ${student.section}`
                                : ""}
                            </td>

                            <td className="px-4 py-3 font-medium text-slate-700">
                              {payment
                                ? `₹${Number(
                                    payment.totalAmount || 0,
                                  ).toLocaleString("en-IN")}`
                                : "—"}
                            </td>

                            <td className="px-4 py-3">
                              {payment ? (
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                    payment.status === "Paid"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {payment.status}
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                  No Fee Generated
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-right">
                              {payment ? (
                                payment.status === "Pending" ? (
                                  <RazorpayCheckout
                                    feePaymentId={payment._id}
                                    amount={payment.totalAmount}
                                    studentName={studentName}
                                    description={`Fee payment - ${
                                      payment.feeType || "School Fee"
                                    }`}
                                    onSuccess={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                  />
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    Paid
                                  </span>
                                )
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleGenerateForStudent(student)
                                  }
                                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-700"
                                >
                                  Generate Fee
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-slate-500">
                  No student found.
                </div>
              )}
            </div>
          ) : null}

          {/* Existing Fee Table */}
          {!studentSearch.trim() ? (
            isLoading ? (
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
                  paymentComponent={(payment) =>
                    payment?.status === "Pending" &&
                    payment?.student ? (
                      <RazorpayCheckout
                        feePaymentId={payment._id}
                        amount={payment.totalAmount}
                        studentName={
                          payment.student
                            ? `${payment.student.firstName || ""} ${
                                payment.student.lastName || ""
                              }`.trim()
                            : "Student"
                        }
                        description={`Fee payment - ${
                          payment.feeType || "School Fee"
                        }`}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    ) : null
                  }
                />

                <FeePagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  limit={limit}
                  onPageChange={handlePageChange}
                />
              </>
            )
          ) : null}
        </>
      )}
    </div>
  );
}

export default FeesPage;
