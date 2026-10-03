const statusStyles = {
  Paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
};

const ParentFeeStatusBadge = ({ status }) => {
  const style =
    statusStyles[status] ||
    "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${style}`}
    >
      {status || "Unknown"}
    </span>
  );
};

export default ParentFeeStatusBadge;
