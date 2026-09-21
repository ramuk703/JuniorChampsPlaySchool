import { FiEdit2, FiTrash2, FiUser } from "react-icons/fi";

import StudentStatusBadge from "./StudentStatusBadge";

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

function StudentTable({
  students = [],
  loading = false,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 px-5 py-4"
          >
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            </div>

            <div className="hidden h-4 w-20 animate-pulse rounded bg-slate-100 md:block" />
            <div className="hidden h-4 w-20 animate-pulse rounded bg-slate-100 lg:block" />
            <div className="h-8 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <FiUser
          size={32}
          className="mx-auto text-slate-300"
        />

        <h3 className="mt-3 text-sm font-semibold text-slate-900">
          No students found
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Try changing your search or add a new student.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Student
            </th>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admission No.
            </th>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Class
            </th>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mobile
            </th>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>

            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {students.map((student) => {
            const fullName = [
              student.firstName,
              student.lastName,
            ]
              .filter(Boolean)
              .join(" ");

            const photoUrl = getPhotoUrl(student.photo || student.studentPhoto);

            return (
              <tr
                key={student._id}
                className="transition hover:bg-slate-50"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={fullName || "Student"}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <FiUser size={18} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {fullName || "Unnamed Student"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {student.gender || "—"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {student.admissionNo || "—"}
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {student.className || "—"}
                  {student.section ? ` - ${student.section}` : ""}
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {student.mobile || "—"}
                </td>

                <td className="px-5 py-4">
                  <StudentStatusBadge status={student.status} />
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(student)}
                      aria-label={`Edit ${fullName}`}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <FiEdit2 size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete?.(student)}
                      aria-label={`Delete ${fullName}`}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <FiTrash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default StudentTable;