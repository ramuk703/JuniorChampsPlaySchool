import { FiCalendar, FiUser } from "react-icons/fi";
import TeacherAttendanceStatusBadge from "./TeacherAttendanceStatusBadge";

const getPhotoUrl = (photo) => {
  if (!photo) return "";

  if (/^https?:\/\//i.test(photo)) {
    return photo;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

  return `${baseUrl}/${String(photo).replace(/^\/+/, "")}`;
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function TeacherAttendanceTable({ records = [] }) {
  if (!records.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <FiCalendar className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-600">
          No teacher attendance records found
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[850px] w-full text-left">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Teacher
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Remarks
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recorded
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {records.map((record) => {
              const teacher = record.teacher;

              const teacherName = teacher
                ? `${teacher.firstName || ""} ${
                    teacher.lastName || ""
                  }`.trim()
                : "Unknown Teacher";

              return (
                <tr
                  key={record._id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {teacher?.photo ? (
                        <img
                          src={getPhotoUrl(teacher.photo)}
                          alt={teacherName || "Teacher"}
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <FiUser className="h-4 w-4" />
                        </div>
                      )}

                      <div>
                        <div className="font-medium text-slate-800">
                          {teacherName || "Unknown Teacher"}
                        </div>

                        <div className="text-xs text-slate-500">
                          {teacher?.email || "—"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatDate(record.date)}
                  </td>

                  <td className="px-4 py-4">
                    <TeacherAttendanceStatusBadge status={record.status} />
                  </td>

                  <td className="max-w-xs px-4 py-4 text-sm text-slate-600">
                    <span className="line-clamp-2">
                      {record.remarks || "—"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-500">
                    {formatDate(record.createdAt)}
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

export default TeacherAttendanceTable;
