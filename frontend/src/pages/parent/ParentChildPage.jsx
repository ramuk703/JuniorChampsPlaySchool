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

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getInitials = (firstName = "", lastName = "") =>
  `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase() ||
  "S";

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}

function ParentChildPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { parent, dashboard, dashboardLoading, error } = useSelector(
    (state) => state.parentAuth,
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!dashboard) {
      dispatch(fetchParentDashboard());
    }
  }, [dispatch, dashboard]);

  const handleLogout = async () => {
    await dispatch(logoutParent());
    navigate("/parent/login", { replace: true });
  };

  const student = dashboard?.student;

  const parentData = dashboard?.parent || parent;

  const studentName =
    [student?.firstName, student?.lastName].filter(Boolean).join(" ") ||
    "Student";

  const photoUrl = getUploadUrl(student?.photo);

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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
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
                  My Child
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

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
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
              <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-xl bg-white shadow-sm"
                  />
                ))}
              </div>
            </div>
          ) : !student ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500">
                ♙
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                No Child Linked
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                There is currently no active student linked to this parent
                account. Please contact the school administration.
              </p>
            </div>
          ) : (
            <>
              {/* Profile Hero */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-32 bg-slate-900 sm:h-40" />

                <div className="px-5 pb-6 sm:px-8">
                  <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end">
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 text-3xl font-bold text-slate-700 shadow-md sm:h-32 sm:w-32">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={studentName}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(student.firstName, student.lastName)
                      )}
                    </div>

                    <div className="pb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-bold text-slate-900">
                          {studentName}
                        </h2>

                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {student.status || "Active"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        Admission No: {student.admissionNo || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Basic Information */}
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Student Information
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Basic information available for your child.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    label="First Name"
                    value={student.firstName}
                  />

                  <DetailItem
                    label="Last Name"
                    value={student.lastName}
                  />

                  <DetailItem
                    label="Admission Number"
                    value={student.admissionNo}
                  />

                  <DetailItem
                    label="Gender"
                    value={student.gender}
                  />

                  <DetailItem
                    label="Date of Birth"
                    value={formatDate(student.dob)}
                  />

                  <DetailItem
                    label="Class"
                    value={student.className}
                  />

                  <DetailItem
                    label="Section"
                    value={student.section}
                  />

                  <DetailItem
                    label="Status"
                    value={student.status}
                  />
                </div>
              </section>

              {/* Academic Information */}
              <section className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">
                    Academic Details
                  </h3>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                      <div>
                        <p className="text-xs text-slate-400">Class</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {student.className || "—"}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-700 shadow-sm">
                        CL
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                      <div>
                        <p className="text-xs text-slate-400">Section</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {student.section || "—"}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-700 shadow-sm">
                        SE
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                      <div>
                        <p className="text-xs text-slate-400">
                          Admission Number
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {student.admissionNo || "—"}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-700 shadow-sm">
                        ID
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">
                    Parent Information
                  </h3>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-400">Father&apos;s Name</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {parentData?.fatherName || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-400">Mother&apos;s Name</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {parentData?.motherName || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-400">Parent Email</p>
                      <p className="mt-1 break-all font-semibold text-slate-900">
                        {parentData?.email || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-400">Mobile</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {parentData?.mobile || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Navigation shortcuts */}
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Quick Access
                </h3>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <NavLink
                    to="/parent"
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">
                      Dashboard
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      View overall summary
                    </p>
                  </NavLink>

                  <NavLink
                    to="/parent/attendance"
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">
                      Attendance
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      View attendance records
                    </p>
                  </NavLink>

                  <NavLink
                    to="/parent/fees"
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">
                      Fees & Payments
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Check fee information
                    </p>
                  </NavLink>

                  <NavLink
                    to="/parent/profile"
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">
                      My Profile
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      View parent details
                    </p>
                  </NavLink>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default ParentChildPage;
