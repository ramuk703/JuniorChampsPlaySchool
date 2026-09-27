import {
  FiCheckCircle,
  FiClock,
  FiPercent,
  FiXCircle,
} from "react-icons/fi";

function AttendanceStats({ stats = {}, isLoading = false }) {
  const total =
    (stats.todayPresent ?? 0) +
    (stats.todayAbsent ?? 0) +
    (stats.todayLeave ?? 0);

  const cards = [
    {
      label: "Present Today",
      value: stats.todayPresent ?? 0,
      icon: FiCheckCircle,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Absent Today",
      value: stats.todayAbsent ?? 0,
      icon: FiXCircle,
      className: "bg-red-50 text-red-700",
    },
    {
      label: "Leave Today",
      value: stats.todayLeave ?? 0,
      icon: FiClock,
      className: "bg-amber-50 text-amber-700",
    },
    {
      label: "Attendance %",
      value: `${stats.attendancePercentage ?? 0}%`,
      icon: FiPercent,
      className: "bg-blue-50 text-blue-700",
      subtitle: `Total records today: ${total}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {isLoading ? "—" : card.value}
                </p>

                {card.subtitle && !isLoading && (
                  <p className="mt-1 text-xs text-slate-500">
                    {card.subtitle}
                  </p>
                )}
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.className}`}
              >
                <Icon className="text-xl" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AttendanceStats;
