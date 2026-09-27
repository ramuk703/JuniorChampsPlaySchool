import { FiCalendar, FiUser } from "react-icons/fi";

import AttendanceStatusBadge from "./AttendanceStatusBadge";

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const getPhotoUrl = (photo) => {
  if (!photo) {
    return "";
  }

  if (
    photo.startsWith("http://") ||
    photo.startsWith("https://") ||
    photo.startsWith("blob:")
  ) {
    return photo;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const backendUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

  return `${backendUrl}/${photo.replace(/^\/+/, "")}`;
};

function AttendanceTable({ attendance = [] }) {
  if (!attendance.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <FiCalendar className="mx-auto mb-3 text-3xl text-slate-400" />

        <h3 className="text-base font-semibold text-slate-900">
          No attendance records found
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Try changing the date, class, or status filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Student
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Class
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Marked By
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Time
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {attendance.map((record) => {
              const student = record.student || {};
              const fullName =
                `${student.firstName || ""} ${student.lastName || ""}`.trim();

              return (
                <tr key={record._id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center gap-3">
                      {student.photo ? (
                        <img
                          src={getPhotoUrl(student.photo)}
                          alt={fullName || "Student"}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <FiUser />
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {fullName || "Unknown Student"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {student.admissionNo || "No admission number"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                    <div className="font-medium">
                      {student.className || record.className || "—"}
                    </div>

                    {student.section && (
                      <div className="text-xs text-slate-500">
                        Section {student.section}
                      </div>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                    {formatDate(record.date)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4">
                    <AttendanceStatusBadge status={record.status} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="text-sm font-medium text-slate-700">
                      {record.markedBy?.name || "—"}
                    </div>

                    {record.markedBy?.email && (
                      <div className="text-xs text-slate-500">
                        {record.markedBy.email}
                      </div>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                    {formatTime(record.createdAt)}
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

export default AttendanceTable;
