import { FiDollarSign } from "react-icons/fi";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

function FeeStructureTable({ feeStructures = [] }) {
  if (!feeStructures.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <FiDollarSign className="mx-auto h-8 w-8 text-slate-300" />
        <h3 className="mt-3 text-sm font-semibold text-slate-700">
          No fee structures found
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Create a fee structure to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Class
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Admission
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Monthly
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Transport
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Annual
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Exam
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {feeStructures.map((structure) => {
              const total =
                Number(structure.admissionFee || 0) +
                Number(structure.monthlyFee || 0) +
                Number(structure.transportFee || 0) +
                Number(structure.annualFee || 0) +
                Number(structure.examFee || 0);

              return (
                <tr
                  key={structure._id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-800">
                      {structure.className}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatCurrency(structure.admissionFee)}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatCurrency(structure.monthlyFee)}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatCurrency(structure.transportFee)}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatCurrency(structure.annualFee)}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatCurrency(structure.examFee)}
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-indigo-600">
                    {formatCurrency(total)}
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

export default FeeStructureTable;
