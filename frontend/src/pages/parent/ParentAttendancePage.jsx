import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";

import {
  fetchParentDashboard,
  logoutParent,
} from "../../store/parentAuthSlice";

const navItems = [
  { label: "Dashboard", icon: "⌂", path: "/parent" },
  { label: "My Child", icon: "♙", path: "/parent/child" },
  { label: "Attendance", icon: "◷", path: "/parent/attendance" },
  { label: "Fees & Payments", icon: "₹", path: "/parent/fees" },
  { label: "My Profile", icon: "◯", path: "/parent/profile" },
  { label: "Change Password", icon: "⌕", path: "/parent/password" },
];

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const getUploadUrl = (photo) => {
  if (!photo) return null;

  const value = String(photo).trim();

  if (!value) return null;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const backendUrl = API_URL.replace(/\/api\/v1\/?$/, "");

  if (value.startsWith("/uploads/")) {
    return `${backendUrl}${value}`;
  }

  if (value.startsWith("uploads/")) {
    return `${backendUrl}/${value}`;
  }

  return `${backendUrl}/uploads/students/${value}`;
};


const getInitials = (firstName = "", lastName = "") =>
  `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase() ||
  "S";

function StatCard({ title, value, subtitle, icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ParentAttendancePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { parent, dashboard, dashboardLoading, error } = useSelector(
    (state) => state.parentAuth,
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchParentDashboard());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutParent());
    navigate("/parent/login", { replace: true });
  };

  const parentData = dashboard?.parent || parent;
  const student = dashboard?.student;
  const attendance = dashboard?.attendance || {};

  const percentage = Number(attendance.percentage || 0);
  const total = Number(attendance.total || 0);
  const present = Number(attendance.present || 0);
  const absent = Number(attendance.absent || 0);
  const leave = Number(attendance.leave || 0);

  const studentName =
[student?.firstName, student?.lastName].filter(Boolean).join(" ") ||
    "Student";
  const photoUrl = getUploadUrl(student?.photo);

  const percentageStatus =
    percentage >= 75
      ? {
          label: "Good Attendance",
          text: "text-emerald-600",
          bg: "bg-emerald-50",
        }
      : percentage >= 50
        ? {
            label: "Needs Attention",
            text: "text-amber-600",
            bg: "bg-amber-50",
          }
        : {
            label: "Low Attendance",
            text: "text-rose-600",
            bg: "bg-rose-50",
          };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center border-b border-slate-200 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
            JC
          </div>

          <div className="ml-3">
            <p className="font-bold text-slate-900">Junior Champ&apos;s</p>
            <p className="text-xs text-slate-500">Play School</p>
          </div>

          <button
            type="button"
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <div className="border-b border-slate-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-900 text-sm font-bold text-white shadow-sm">
              {`${parentData?.fatherName?.charAt(0) || ""}${
                parentData?.motherName?.charAt(0) || ""
              }`.toUpperCase() || "P"}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">
                {parentData?.fatherName || "Parent"}
              </p>
              <p className="truncate text-xs text-slate-500">
                Parent Account
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Parent Portal
          </p>

          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/parent"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-current/10 text-base">
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
              ↪
            </span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
                aria-label="Open menu"
              >
                ☰
              </button>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Parent Portal
                </p>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Attendance
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {parentData?.fatherName || "Parent"}
                </p>
                <p className="text-xs text-slate-500">
                  {parentData?.email || ""}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-900 text-sm font-bold text-white shadow-sm">
                {`${parentData?.fatherName?.charAt(0) || ""}${
                  parentData?.motherName?.charAt(0) || ""
                }`.toUpperCase() || "P"}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {dashboardLoading && !dashboard ? (
            <div className="space-y-6">
              <div className="h-56 animate-pulse rounded-2xl bg-white" />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-32 animate-pulse rounded-2xl bg-white"
                  />
                ))}
              </div>
            </div>
          ) : !student ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                No Child Linked
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                No active student is linked to this parent account.
              </p>
            </div>
          ) : (
            <>
              {/* Child header */}
              <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-xl font-bold text-slate-900">
                      {getUploadUrl(student.photo) ? (
                        <img
                          src={photoUrl}
                          alt={studentName}
                          className="h-full w-full rounded-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        getInitials(student.firstName, student.lastName)
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-slate-300">
                        Attendance Record
                      </p>
                      <h2 className="mt-1 text-2xl font-bold">
                        {studentName}
                      </h2>
                      <p className="mt-1 text-sm text-slate-300">
                        {student.className || "Class"}
                        {student.section
                          ? ` • Section ${student.section}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/10 px-5 py-4">
                    <p className="text-xs text-slate-300">
                      Overall Attendance
                    </p>
                    <p className="mt-1 text-3xl font-bold">{percentage}%</p>
                  </div>
                </div>
              </section>

              {/* Statistics */}
              <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Attendance"
                  value={`${percentage}%`}
                  subtitle="Overall percentage"
                  icon="✓"
                  iconClass="bg-emerald-50 text-emerald-600"
                />

                <StatCard
                  title="Present"
                  value={present}
                  subtitle="Days present"
                  icon="P"
                  iconClass="bg-blue-50 text-blue-600"
                />

                <StatCard
                  title="Absent"
                  value={absent}
                  subtitle="Days absent"
                  icon="A"
                  iconClass="bg-rose-50 text-rose-600"
                />

                <StatCard
                  title="Leave"
                  value={leave}
                  subtitle="Leave records"
                  icon="L"
                  iconClass="bg-amber-50 text-amber-600"
                />
              </section>

              {/* Progress */}
              <section className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Attendance Progress
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Overall attendance calculated from recorded attendance
                        entries.
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${percentageStatus.bg} ${percentageStatus.text}`}
                    >
                      {percentageStatus.label}
                    </span>
                  </div>

                  <div className="mt-8">
                    <div className="flex items-end justify-between">
                      <span className="text-sm font-medium text-slate-500">
                        Attendance
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {percentage}%
                      </span>
                    </div>

                    <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all duration-500"
                        style={{
                          width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-emerald-700">
                          Present
                        </p>
                        <span className="font-bold text-emerald-700">P</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-emerald-800">
                        {present}
                      </p>
                    </div>

                    <div className="rounded-xl border border-rose-100 bg-rose-50 p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-rose-700">
                          Absent
                        </p>
                        <span className="font-bold text-rose-700">A</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-rose-800">
                        {absent}
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-amber-700">
                          Leave
                        </p>
                        <span className="font-bold text-amber-700">L</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-amber-800">
                        {leave}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">
                    Attendance Summary
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Recorded attendance for {studentName}.
                  </p>

                  <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-center">
                    <p className="text-sm text-slate-500">
                      Total Records
                    </p>
                    <p className="mt-2 text-4xl font-bold text-slate-900">
                      {total}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Present</span>
                      <span className="font-semibold text-emerald-600">
                        {present}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Absent</span>
                      <span className="font-semibold text-rose-600">
                        {absent}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Leave</span>
                      <span className="font-semibold text-amber-600">
                        {leave}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* No-record information */}
              {total === 0 && (
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
                    ◷
                  </div>

                  <h3 className="mt-4 font-bold text-slate-900">
                    No Attendance Records Yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                    Attendance records for your child have not been recorded
                    yet. Once the school marks attendance, the information
                    will appear here automatically.
                  </p>
                </section>
              )}

              {/* Information */}
              <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white font-bold text-blue-600">
                    i
                  </div>

                  <div>
                    <h3 className="font-semibold text-blue-900">
                      Attendance Information
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-blue-800">
                      Attendance percentage is calculated using the recorded
                      Present, Absent, and Leave entries for your child.
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default ParentAttendancePage;
