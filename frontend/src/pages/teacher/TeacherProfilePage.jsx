import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTeacherProfile } from "../../services/teacherAuthService";
export default function TeacherProfilePage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["teacher-portal-profile"], queryFn: getTeacherProfile, retry: false });
  const t = data?.teacher;
  const fields = [["Employee ID",t?.employeeId],["First name",t?.firstName],["Last name",t?.lastName],["Email",t?.email],["Mobile",t?.mobile],["Qualification",t?.qualification],["Experience",t?.experience == null ? null : `${t.experience} years`],["Class teacher",t?.classTeacher],["Joining date",t?.joiningDate ? new Date(t.joiningDate).toLocaleDateString() : null],["Status",t?.status],["Address",t?.address]];
  return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><Link to="/teacher" className="text-sm text-indigo-600 hover:underline">← Dashboard</Link><h1 className="mt-4 text-3xl font-bold">My profile</h1><p className="mt-2 text-slate-600">Your staff details are managed by the school administrator.</p>{isLoading && <p className="mt-6">Loading profile…</p>}{error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error.message || "Could not load profile."}</p>}{t && <div className="mt-6 grid gap-4 rounded-xl border bg-white p-6 sm:grid-cols-2">{fields.map(([label,value]) => <div key={label} className="border-b pb-3"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 break-words font-medium">{value || "—"}</p></div>)}</div>}</main>;
}
