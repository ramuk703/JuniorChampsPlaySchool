import { useQuery } from "@tanstack/react-query";
import {
  FiActivity,
  FiAlertCircle,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";

import QuickActions from "../../components/dashboard/QuickActions";
import RecentStudents from "../../components/dashboard/RecentStudents";
import StatCard from "../../components/dashboard/StatCard";
import { getDashboardStats } from "../../services/dashboardService";
import { getStudents } from "../../services/studentService";

function DashboardPage() {
  const {
    data: dashboardData,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorDetails,
    refetch: refetchStats,
    isFetching: statsFetching,
  } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  });

  const {
    data: studentsData,
    isLoading: studentsLoading,
    isError: studentsError,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ["students", "recent"],
    queryFn: () => getStudents({ page: 1, limit: 5 }),
  });

  const stats = dashboardData?.data;
  const students = studentsData?.students || [];

  const handleRefresh = async () => {
    await Promise.all([refetchStats(), refetchStudents()]);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Overview of Junior Champ&apos;s Play School.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={statsFetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiRefreshCw
            size={16}
            className={statsFetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </section>

      {statsError ? (
        <section
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <div className="flex gap-3">
            <FiAlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load dashboard statistics
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {statsErrorDetails?.response?.data?.message ||
                  statsErrorDetails?.message ||
                  "Something went wrong while loading dashboard data."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={FiUsers}
          description="Students currently registered"
          loading={statsLoading}
        />

        <StatCard
          title="Active Students"
          value={stats?.activeStudents ?? 0}
          icon={FiActivity}
          description="Students currently marked active"
          loading={statsLoading}
        />

        <StatCard
          title="Inactive Students"
          value={stats?.inactiveStudents ?? 0}
          icon={FiUsers}
          description="Students currently marked inactive"
          loading={statsLoading}
        />

        <StatCard
          title="Total Teachers"
          value={stats?.totalTeachers ?? 0}
          icon={FiUsers}
          description="Teachers registered in the system"
          loading={statsLoading}
        />

        <StatCard
          title="Active Teachers"
          value={stats?.activeTeachers ?? 0}
          icon={FiActivity}
          description="Teachers currently marked active"
          loading={statsLoading}
        />

        <StatCard
          title="Inactive Teachers"
          value={stats?.inactiveTeachers ?? 0}
          icon={FiUsers}
          description="Teachers currently marked inactive"
          loading={statsLoading}
        />
      </section>

      {studentsError ? (
        <section
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800"
        >
          Recent students could not be loaded. The dashboard statistics are
          still available.
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <RecentStudents
          students={students}
          loading={studentsLoading}
        />

        <QuickActions />
      </section>
    </div>
  );
}

export default DashboardPage;