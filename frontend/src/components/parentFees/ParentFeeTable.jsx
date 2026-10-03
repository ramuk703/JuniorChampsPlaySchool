import { FiArrowRight, FiCheckCircle, FiCreditCard } from "react-icons/fi";
import ParentFeeStatusBadge from "./ParentFeeStatusBadge";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatMonthYear = (month, year) => {
  if (!month || !year) return "-";

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ParentFeeTable = ({ fees = [], onPay, payingFeeId }) => {
  if (!fees.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <FiCreditCard className="mx-auto h-10 w-10 text-slate-300" />
        <p className="font-medium text-slate-700">
          No fee records found.
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Your child's fee records will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Fee Period",
                "Fee Type",
                "Amount",
                "Status",
                "Payment Date",
                "Receipt",
                "Action",
              ].map((heading) => (
                <th
                  key={heading}
                  className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {fees.map((fee) => {
              const isPaying = payingFeeId === fee._id;

              return (
                <tr
                  key={fee._id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-800">
                    {formatMonthYear(fee.month, fee.year)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {fee.feeType || "-"}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                    {formatCurrency(fee.totalAmount)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <ParentFeeStatusBadge status={fee.status} />
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {formatDate(fee.paymentDate)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {fee.receiptNumber || "-"}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    {fee.status === "Pending" ? (
                      <button
                        type="button"
                        onClick={() => onPay?.(fee)}
                        disabled={isPaying}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPaying ? (
                          "Processing..."
                        ) : (
                          <>
                            Pay {formatCurrency(fee.totalAmount)}
                            <FiArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                        <FiCheckCircle className="h-4 w-4" />
                        Paid
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParentFeeTable;
