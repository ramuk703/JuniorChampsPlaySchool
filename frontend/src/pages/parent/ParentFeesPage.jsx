import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiAlertCircle, FiCheckCircle, FiRefreshCw } from "react-icons/fi";

import { fetchParentDashboard } from "../../store/parentAuthSlice";
import { getParentFees } from "../../services/parentFeeService";
import ParentFeeSummary from "../../components/parentFees/ParentFeeSummary";
import ParentFeeTable from "../../components/parentFees/ParentFeeTable";
import ParentRazorpayCheckout from "../../components/payments/ParentRazorpayCheckout";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

function ParentFeesPage() {
  const dispatch = useDispatch();

  const {
    dashboard,
    dashboardLoading,
  } = useSelector((state) => state.parentAuth);

  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFee, setSelectedFee] = useState(null);

  const studentName = useMemo(() => {
    const student = dashboard?.student;

    if (!student) {
      return "Student";
    }

    return [student.firstName, student.lastName]
      .filter(Boolean)
      .join(" ") || "Student";
  }, [dashboard?.student]);

  const loadFees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getParentFees();

      setFees(Array.isArray(response?.fees) ? response.fees : []);
      setSummary(response?.summary || null);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to load fee and payment information."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dashboard?.student) {
      dispatch(fetchParentDashboard());
    }
  }, [dashboard?.student, dispatch]);

  useEffect(() => {
    let cancelled = false;

    const fetchFees = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getParentFees();

        if (cancelled) {
          return;
        }

        setFees(Array.isArray(response?.fees) ? response.fees : []);
        setSummary(response?.summary || null);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          getErrorMessage(
            err,
            "Unable to load fee and payment information."
          )
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchFees();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedFeeStillPending = fees.find(
    (fee) => fee._id === selectedFee?._id && fee.status === "Pending",
  );

  const handlePay = (fee) => {
    if (!fee?._id || fee.status !== "Pending") {
      return;
    }

    setError("");
    setSuccess("");
    setSelectedFee(fee);
  };

  const handlePaymentSuccess = async (payment) => {
    setSuccess(
      `Payment successful. Payment ID: ${
        payment?.paymentId || "received"
      }`
    );
    setError("");

    await loadFees();
    dispatch(fetchParentDashboard());
  };

  const handlePaymentError = (message) => {
    setSuccess("");
    setError(message || "Payment could not be completed.");
  };

  const handleRefresh = async () => {
    setSuccess("");
    await loadFees();
    dispatch(fetchParentDashboard());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            Parent Portal
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Fees & Payments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View fee details and make secure online payments for{" "}
            <span className="font-medium text-slate-700">
              {studentName}
            </span>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || dashboardLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Payment successful</p>
            <p className="mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Unable to complete request</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {summary && <ParentFeeSummary summary={summary} />}

      {!loading && !error && fees.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">
            No fee records found
          </p>

          <p className="mt-1 text-sm text-slate-500">
            There are currently no fee or payment records for this
            student.
          </p>
        </div>
      )}

      <ParentFeeTable
        fees={fees}
        onPay={handlePay}
        payingFeeId={null}
      />
      {selectedFeeStillPending ? (
        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-indigo-50/70 px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-indigo-700">
                Secure Fee Payment
              </p>

              <h2 className="mt-1 font-semibold text-slate-900">
                {selectedFeeStillPending.feeType || "School Fee"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {selectedFeeStillPending.month}/
                {selectedFeeStillPending.year}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFee(null)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-700"
              aria-label="Close payment"
            >
              ×
            </button>
          </div>

          <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm text-slate-500">
                Amount payable
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                ₹
                {Number(
                  selectedFeeStillPending.totalAmount || 0
                ).toLocaleString("en-IN")}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Secure payment powered by Razorpay
              </p>
            </div>

            <ParentRazorpayCheckout
              feePaymentId={selectedFeeStillPending._id}
              amount={selectedFeeStillPending.totalAmount}
              studentName={studentName}
              description={`Fee payment - ${
                selectedFeeStillPending.feeType || "School Fee"
              }`}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        </div>
      ) : null}

    </div>
  );
}

export default ParentFeesPage;
