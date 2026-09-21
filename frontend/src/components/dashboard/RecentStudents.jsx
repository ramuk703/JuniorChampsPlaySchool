import { FiArrowRight, FiUser } from "react-icons/fi";
import { Link } from "react-router-dom";

function getPhotoUrl(photo) {
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
}

function RecentStudents({ students = [], loading = false }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">
            Recent Students
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Latest registered students
          </p>
        </div>

        <Link
          to="/admin/students"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          View all
          <FiArrowRight size={15} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-5 py-4"
              >
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />

                <div className="min-w-0 flex-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-100" />
                </div>

                <div className="hidden h-6 w-16 animate-pulse rounded-full bg-slate-100 sm:block" />
              </div>
            ))
          : students.map((student) => {
              const fullName = [
                student.firstName,
                student.lastName,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={student._id}
                  className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50"
                >
                  {student.photo ? (
                    <img
                      src={getPhotoUrl(student.photo)}
                      alt={fullName || "Student"}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <FiUser size={18} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {fullName || "Unnamed Student"}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {student.admissionNo || "No admission number"}
                      {student.className
                        ? ` • ${student.className}`
                        : ""}
                      {student.section
                        ? `-${student.section}`
                        : ""}
                    </p>
                  </div>

                  <span
                    className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${
                      student.status === "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {student.status || "Unknown"}
                  </span>
                </div>
              );
            })}

        {!loading && students.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <FiUser className="mx-auto text-slate-300" size={28} />

            <p className="mt-3 text-sm font-medium text-slate-700">
              No students found
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Registered students will appear here.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default RecentStudents;
