const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const ParentFeeSummary = ({ summary = {} }) => {
  const cards = [
    {
      label: "Total Fees",
      value: summary.total || 0,
      type: "count",
    },
    {
      label: "Paid Fees",
      value: summary.paid || 0,
      type: "count",
    },
    {
      label: "Pending Fees",
      value: summary.pending || 0,
      type: "count",
    },
    {
      label: "Total Amount",
      value: formatCurrency(summary.totalAmount),
      type: "amount",
    },
    {
      label: "Paid Amount",
      value: formatCurrency(summary.paidAmount),
      type: "amount",
    },
    {
      label: "Pending Amount",
      value: formatCurrency(summary.pendingAmount),
      type: "amount",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">
            {card.label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ParentFeeSummary;
