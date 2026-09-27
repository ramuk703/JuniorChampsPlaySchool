function AttendanceStatusBadge({ status }) {
  const normalizedStatus = String(status || "").toLowerCase();

  const statusConfig = {
    present: {
      label: "Present",
      className:
        "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    },
    absent: {
      label: "Absent",
      className:
        "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
    },
    leave: {
      label: "Leave",
      className:
        "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    },
  };

  const config = statusConfig[normalizedStatus] || {
    label: status || "Unknown",
    className:
      "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export default AttendanceStatusBadge;
