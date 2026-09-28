function FeeStatusBadge({ status }) {
  const styles = {
    Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  };

  const statusStyle =
    styles[status] || "bg-slate-50 text-slate-700 ring-slate-600/20";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyle}`}
    >
      {status || "Unknown"}
    </span>
  );
}

export default FeeStatusBadge;
