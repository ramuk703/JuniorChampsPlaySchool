import { FiCheckCircle, FiCreditCard } from "react-icons/fi";
import FeeStatusBadge from "./FeeStatusBadge";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function FeeTable({
  payments = [],
  onMarkPaid,
  isMarkingPaid = false,
  paymentComponent,
}) {
  if (!payments.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <FiCreditCard className="mx-auto h-10 w-10 text-slate-300" />

        <p className="mt-3 text-sm font-medium text-slate-600">
          No fee records found
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full text-left">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Student
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Period
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fee Type
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Discount
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Late Fee
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Method
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Payment Details
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {payments.map((payment) => {
              const student = payment.student;

              const studentName = student
                ? `${student.firstName || ""} ${
                    student.lastName || ""
                  }`.trim()
                : "Unknown Student";

              return (
                <tr
                  key={payment._id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-800">
                      {studentName || "Unknown Student"}
                    </div>

                    <div className="text-xs text-slate-500">
                      {student?.admissionNo || "—"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {payment.month}/{payment.year}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {payment.feeType || "—"}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatCurrency(payment.amount)}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatCurrency(payment.discount)}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatCurrency(payment.lateFee)}
                  </td>

                  <td className="px-4 py-4 font-semibold text-slate-800">
                    {formatCurrency(payment.totalAmount)}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {payment.paymentMethod || "—"}
                  </td>

                  <td className="px-4 py-4">
                    <FeeStatusBadge status={payment.status} />
                  </td>

                  <td className="px-4 py-4">
                    {payment.status === "Pending" ? (
                      paymentComponent ? (
                        paymentComponent(payment)
                      ) : (
                        <button
                          type="button"
                          onClick={() => onMarkPaid?.(payment)}
                          disabled={isMarkingPaid}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiCheckCircle className="h-4 w-4" />
                          Mark Paid
                        </button>
                      )
                    ) : (
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-emerald-600">
                          Paid on {formatDate(payment.paymentDate)}
                        </div>

                        {payment.receiptNumber ? (
                          <div className="text-xs text-slate-500">
                            Receipt:{" "}
                            <span className="font-medium text-slate-700">
                              {payment.receiptNumber}
                            </span>
                          </div>
                        ) : null}

                        {payment.paymentMethod === "Razorpay" &&
                        payment.razorpayPaymentId ? (
                          <div className="text-xs text-slate-500">
                            Payment ID:{" "}
                            <span className="font-medium text-slate-700">
                              {payment.razorpayPaymentId}
                            </span>
                          </div>
                        ) : null}
                      </div>
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
}

export default FeeTable;
