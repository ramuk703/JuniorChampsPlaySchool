import { FiEdit2, FiTrash2 } from "react-icons/fi";
import TeacherStatusBadge from "./TeacherStatusBadge";

const getPhotoUrl = (photo) => {
  if (!photo) return "";

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

const TeacherTable = ({
  teachers = [],
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  if (!teachers.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          No teachers found.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Teacher
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Employee ID
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contact
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Qualification
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Class Teacher
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {teachers.map((teacher) => {
              const fullName = [teacher.firstName, teacher.lastName]
                .filter(Boolean)
                .join(" ");

              const photoUrl = getPhotoUrl(teacher.photo);

              return (
                <tr
                  key={teacher._id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-3">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={fullName || "Teacher"}
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                          {(teacher.firstName?.[0] || "T").toUpperCase()}
                        </div>
                      )}

                      <div>
                        <p className="font-semibold text-slate-800">
                          {fullName || "Unnamed Teacher"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {teacher.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                    {teacher.employeeId}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <p className="text-sm text-slate-700">
                      {teacher.mobile || "—"}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                    {teacher.qualification || "—"}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                    {teacher.classTeacher || "—"}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <TeacherStatusBadge status={teacher.status} />
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(teacher)}
                        title="Edit teacher"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <FiEdit2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(teacher)}
                        disabled={isDeleting}
                        title="Delete teacher"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherTable;
