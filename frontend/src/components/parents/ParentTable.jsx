import {
  FiEdit2,
  FiMail,
  FiPhone,
  FiTrash2,
  FiUser,
} from "react-icons/fi";

const getStudentName = (student) => {
  if (!student) {
    return "—";
  }

  const name = [student.firstName, student.lastName]
    .filter(Boolean)
    .join(" ");

  if (name) {
    return name;
  }

  return student.admissionNo || "—";
};

function ParentTable({
  parents = [],
  loading = false,
  onEdit,
  onDelete,
  deletingId = null,
}) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {[
                "Father",
                "Mother",
                "Contact",
                "Student",
                "Address",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="border-b border-slate-100">
                {Array.from({ length: 6 }).map((__, cellIndex) => (
                  <td key={cellIndex} className="px-5 py-4">
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (parents.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <FiUser className="mx-auto text-slate-300" size={38} />

        <h3 className="mt-3 text-sm font-semibold text-slate-800">
          No parents found
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          There are no parent records matching your current search.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1050px] w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Father
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mother
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contact
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Student
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Address
            </th>

            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {parents.map((parent) => {
            const isDeleting = deletingId === parent._id;

            return (
              <tr
                key={parent._id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
              >
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-900">
                    {parent.fatherName || "—"}
                  </div>

                  {parent.email ? (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <FiMail size={12} />
                      <span>{parent.email}</span>
                    </div>
                  ) : null}
                </td>

                <td className="px-5 py-4">
                  <span className="text-sm text-slate-700">
                    {parent.motherName || "—"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-700">
                    <FiPhone size={14} className="text-slate-400" />
                    {parent.mobile || "—"}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="font-medium text-slate-800">
                    {getStudentName(parent.student)}
                  </div>

                  {parent.student?.admissionNo ? (
                    <div className="mt-1 text-xs text-slate-500">
                      {parent.student.admissionNo}
                    </div>
                  ) : null}

                  {parent.student?.className ? (
                    <div className="mt-1 text-xs text-slate-500">
                      {parent.student.className}
                      {parent.student.section
                        ? ` - ${parent.student.section}`
                        : ""}
                    </div>
                  ) : null}
                </td>

                <td className="max-w-xs px-5 py-4">
                  <p className="truncate text-sm text-slate-600">
                    {parent.address || "—"}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(parent)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(parent)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiTrash2 size={14} />
                      {isDeleting ? "Deleting..." : "Delete"}
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

export default ParentTable;
