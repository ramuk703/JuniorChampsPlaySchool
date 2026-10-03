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

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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
  "P";

function StatCard({ title, value, subtitle, icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
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

function ParentDashboardPage() {
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
  const fees = dashboard?.fees || {};
  const recentPayments = fees.recentPayments || [];

  const fullParentName =
    [parentData?.fatherName, parentData?.motherName]
      .filter(Boolean)
      .join(" & ") || "Parent";

  const studentName =
[student?.firstName, student?.lastName].filter(Boolean).join(" ") ||
    "Student";
  const photoUrl = getUploadUrl(student?.photo);

  const attendancePercentage = Number(attendance.percentage || 0);

  const attendanceColor =
    attendancePercentage >= 75
      ? "text-emerald-600"
      : attendancePercentage >= 50
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Mobile overlay */}
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
              {getInitials(parentData?.fatherName, parentData?.motherName)}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">
                {fullParentName}
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
        {/* Header */}
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
                  Dashboard
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
                {getInitials(parentData?.fatherName, parentData?.motherName)}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {/* Welcome */}
          <section className="mb-6 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Welcome back
                </p>

                <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                  {parentData?.fatherName
                    ? `Hello, ${parentData.fatherName}!`
                    : "Welcome, Parent!"}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Keep track of your child&apos;s attendance, school fees, and
                  payment history from one place.
                </p>
              </div>

              {student && (
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-slate-900">
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
                    <p className="text-sm font-semibold">{studentName}</p>
                    <p className="text-xs text-slate-300">
                      {student.className || "Class"}{" "}
                      {student.section ? `• Section ${student.section}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {dashboardLoading && !dashboard ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
                />
              ))}
            </div>
          ) : (
            <>
              {/* Stats */}
              <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Attendance"
                  value={`${attendancePercentage}%`}
                  subtitle={`${attendance.present || 0} days present`}
                  icon="✓"
                  iconClass="bg-emerald-50 text-emerald-600"
                />

                <StatCard
                  title="Present"
                  value={attendance.present || 0}
                  subtitle={`${attendance.total || 0} total records`}
                  icon="P"
                  iconClass="bg-blue-50 text-blue-600"
                />

                <StatCard
                  title="Paid Fees"
                  value={formatCurrency(fees.paidAmount)}
                  subtitle={`${fees.paid || 0} payment${fees.paid === 1 ? "" : "s"}`}
                  icon="₹"
                  iconClass="bg-violet-50 text-violet-600"
                />

                <StatCard
                  title="Pending Fees"
                  value={formatCurrency(fees.pendingAmount)}
                  subtitle={`${fees.pending || 0} pending`}
                  icon="!"
                  iconClass="bg-amber-50 text-amber-600"
                />
              </section>

              {/* Attendance + child */}
              <section className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Attendance Overview
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Current attendance summary for your child
                      </p>
                    </div>

                    <div
                      className={`text-2xl font-bold ${attendanceColor}`}
                    >
                      {attendancePercentage}%
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all"
                        style={{
                          width: `${Math.min(
                            Math.max(attendancePercentage, 0),
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-xs font-medium text-emerald-600">
                        Present
                      </p>
                      <p className="mt-1 text-xl font-bold text-emerald-700">
                        {attendance.present || 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-rose-50 p-4">
                      <p className="text-xs font-medium text-rose-600">
                        Absent
                      </p>
                      <p className="mt-1 text-xl font-bold text-rose-700">
                        {attendance.absent || 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-amber-50 p-4">
                      <p className="text-xs font-medium text-amber-600">
                        Leave
                      </p>
                      <p className="mt-1 text-xl font-bold text-amber-700">
                        {attendance.leave || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">My Child</h3>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      Active
                    </span>
                  </div>

                  {student ? (
                    <div className="mt-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-lg font-bold text-slate-700">
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
                          <p className="font-bold text-slate-900">
                            {studentName}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Admission: {student.admissionNo || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                        <div className="flex justify-between gap-4 text-sm">
                          <span className="text-slate-500">Class</span>
                          <span className="font-medium text-slate-900">
                            {student.className || "—"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4 text-sm">
                          <span className="text-slate-500">Section</span>
                          <span className="font-medium text-slate-900">
                            {student.section || "—"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4 text-sm">
                          <span className="text-slate-500">Gender</span>
                          <span className="font-medium capitalize text-slate-900">
                            {student.gender || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      No active student is linked to this parent account.
                    </div>
                  )}
                </div>
              </section>

              {/* Fees */}
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Fee Summary
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Overview of your child&apos;s school fees
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500">Total fees</p>
                    <p className="text-xl font-bold text-slate-900">
                      {formatCurrency(fees.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Paid Amount</p>
                    <p className="mt-1 text-xl font-bold text-emerald-600">
                      {formatCurrency(fees.paidAmount)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Pending Amount</p>
                    <p className="mt-1 text-xl font-bold text-amber-600">
                      {formatCurrency(fees.pendingAmount)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Payments</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {fees.paid || 0}
                    </p>
                  </div>
                </div>
              </section>

              {/* Recent payments */}
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Recent Payments
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Your latest fee payment activity
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {recentPayments.length} record
                    {recentPayments.length === 1 ? "" : "s"}
                  </span>
                </div>

                {recentPayments.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
                      ₹
                    </div>
                    <p className="mt-3 font-medium text-slate-700">
                      No payments found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Your completed fee payments will appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden overflow-x-auto md:block">
                      <table className="min-w-full">
                        <thead className="bg-slate-50">
                          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <th className="px-6 py-3">Fee</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Method</th>
                            <th className="px-6 py-3">Receipt</th>
                            <th className="px-6 py-3">Date</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {recentPayments.map((payment) => (
                            <tr
                              key={payment._id}
                              className="text-sm text-slate-700"
                            >
                              <td className="px-6 py-4 font-medium text-slate-900">
                                {payment.feeType || "Fee"}
                              </td>
                              <td className="px-6 py-4 font-semibold">
                                {formatCurrency(payment.totalAmount)}
                              </td>
                              <td className="px-6 py-4 capitalize">
                                {payment.paymentMethod || "—"}
                              </td>
                              <td className="px-6 py-4">
                                {payment.receiptNumber || "—"}
                              </td>
                              <td className="px-6 py-4">
                                {formatDate(payment.paymentDate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="space-y-3 p-4 md:hidden">
                      {recentPayments.map((payment) => (
                        <div
                          key={payment._id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-900">
                              {payment.feeType || "Fee"}
                            </p>
                            <p className="font-bold text-slate-900">
                              {formatCurrency(payment.totalAmount)}
                            </p>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-slate-400">Method</p>
                              <p className="mt-1 capitalize text-slate-700">
                                {payment.paymentMethod || "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-slate-400">Date</p>
                              <p className="mt-1 text-slate-700">
                                {formatDate(payment.paymentDate)}
                              </p>
                            </div>

                            <div className="col-span-2">
                              <p className="text-slate-400">Receipt</p>
                              <p className="mt-1 text-slate-700">
                                {payment.receiptNumber || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default ParentDashboardPage;
