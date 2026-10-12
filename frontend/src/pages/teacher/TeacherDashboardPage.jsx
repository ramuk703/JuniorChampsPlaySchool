import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { clearTeacherAuth, fetchTeacherMe } from "../../store/teacherAuthSlice";
import { getTeacherDashboard } from "../../services/teacherAuthService";
import TeacherPortalLayout from "../../components/teachers/TeacherPortalLayout";
function Stat({ label, value }) { return <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
export default function TeacherDashboardPage() {
  const dispatch = useDispatch(); const navigate = useNavigate();
  const { user, teacher } = useSelector((state) => state.teacherAuth);
  const query = useQuery({ queryKey: ["teacher-portal-dashboard"], queryFn: getTeacherDashboard, retry: false });
  useEffect(() => { if (!teacher) dispatch(fetchTeacherMe()); }, [dispatch, teacher]);
  const profile = query.data?.teacher || teacher;
  const attendance = query.data?.attendance;
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || user?.name || "Teacher";
  const signOut = () => { dispatch(clearTeacherAuth()); navigate("/teacher/login", { replace: true }); };
  return <TeacherPortalLayout title="Dashboard"><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-600">TEACHER PORTAL</p><h1 className="mt-1 text-3xl font-bold">Welcome, {name}</h1><p className="mt-2 text-slate-600">Your teaching profile and attendance overview.</p></div><button onClick={signOut} className="rounded-lg border px-4 py-2 text-sm">Sign out</button></div>
    {query.isLoading && <p className="mt-8">Loading dashboard…</p>}
    {query.error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{query.error.message || "Could not load dashboard."}</p>}
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Employee ID" value={profile?.employeeId || "—"} /><Stat label="Class teacher" value={profile?.classTeacher || "Not assigned"} /><Stat label="Present this month" value={attendance?.thisMonth?.present ?? "—"} /><Stat label="Absent this month" value={attendance?.thisMonth?.absent ?? "—"} /></section>
    <section className="mt-8 grid gap-6 lg:grid-cols-3"><div className="rounded-xl border bg-white p-6 lg:col-span-2"><h2 className="text-lg font-semibold">Recent attendance</h2>{!attendance?.recent?.length && !query.isLoading ? <p className="mt-4 text-sm text-slate-500">No attendance records available.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-500"><tr><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Status</th><th className="py-2">Remarks</th></tr></thead><tbody>{(attendance?.recent || []).map((row) => <tr key={row._id} className="border-t"><td className="py-3 pr-4">{new Date(row.date).toLocaleDateString()}</td><td className="py-3 pr-4">{row.status}</td><td className="py-3">{row.remarks || "—"}</td></tr>)}</tbody></table></div>}</div><div className="rounded-xl border bg-white p-6"><h2 className="text-lg font-semibold">Quick links</h2><div className="mt-4 flex flex-col gap-3"><Link className="rounded-lg bg-indigo-50 px-4 py-3 font-medium text-indigo-700" to="/teacher/profile">My profile</Link><Link className="rounded-lg bg-indigo-50 px-4 py-3 font-medium text-indigo-700" to="/teacher/attendance">Attendance history</Link>
<Link className="rounded-lg bg-indigo-50 px-4 py-3 font-medium text-indigo-700" to="/teacher/change-password">Change password</Link></div></div></section>
  </main></TeacherPortalLayout>;
}
