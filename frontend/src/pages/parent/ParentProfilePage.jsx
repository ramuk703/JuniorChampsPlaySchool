import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchParentDashboard } from "../../store/parentAuthSlice";

function getInitials(parent) {
  const first = parent?.fatherName?.trim()?.charAt(0) || "";
  const last = parent?.motherName?.trim()?.charAt(0) || "";

  return `${first}${last}`.toUpperCase() || "P";
}

function ParentProfilePage() {
  const dispatch = useDispatch();

  const { parent, dashboard, dashboardLoading, error } = useSelector(
    (state) => state.parentAuth,
  );

  const profile = dashboard?.parent || parent;

  useEffect(() => {
    if (!dashboard) {
      dispatch(fetchParentDashboard());
    }
  }, [dispatch, dashboard]);

  if (dashboardLoading && !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-slate-500">Loading profile...</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            to="/parent"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your parent account information.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-900 px-6 py-8 sm:px-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700 ring-4 ring-white/20">
                {getInitials(profile)}
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-white">
                  {profile?.fatherName || "Parent"}
                </h2>

                <p className="mt-1 text-sm text-slate-300">
                  Parent Account
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Father&apos;s Name
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {profile?.fatherName || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mother&apos;s Name
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {profile?.motherName || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </p>
              <p className="mt-1 break-all font-medium text-slate-900">
                {profile?.email || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mobile
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {profile?.mobile || "Not provided"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Address
              </p>
              <p className="mt-1 whitespace-pre-line font-medium text-slate-900">
                {profile?.address || "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
            <Link
              to="/parent/password"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Change Password
            </Link>

            <Link
              to="/parent"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParentProfilePage;
