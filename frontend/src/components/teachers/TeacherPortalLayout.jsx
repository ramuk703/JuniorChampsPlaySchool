import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { clearTeacherAuth } from "../../store/teacherAuthSlice";
import { getTeacherMe } from "../../services/teacherAuthService";

const getUploadUrl = (photo) => {
  if (!photo) return "";
  if (/^https?:\/\//i.test(photo) || photo.startsWith("blob:")) return photo;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  const backendUrl = apiUrl.replace(/\/api\/v1\/?$/, "");
  return `${backendUrl}/${photo.replace(/^\/+/, "")}`;
};

const navItems = [
  { path: "/teacher", label: "Dashboard", icon: "⌂", end: true },
  { path: "/teacher/profile", label: "My Profile", icon: "◉" },
  { path: "/teacher/attendance", label: "My Attendance", icon: "✓" },
];

export default function TeacherPortalLayout({ title, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data } = useQuery({ queryKey: ["teacher-me"], queryFn: getTeacherMe, retry: false });
  const teacher = data?.teacher || data?.data?.teacher || data?.data || null;
  const name = [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ") || teacher?.name || "Teacher";
  const photoUrl = getUploadUrl(teacher?.photo);
  const initials = `${teacher?.firstName?.[0] || ""}${teacher?.lastName?.[0] || ""}`.toUpperCase() || "T";
  const clearTeacherSession = () => {
    dispatch(clearTeacherAuth());
    navigate("/teacher/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {mobileMenuOpen && <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center border-b border-slate-200 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">JC</div>
          <div className="ml-3"><p className="font-bold text-slate-900">Junior Champ&apos;s</p><p className="text-xs text-slate-500">Play School</p></div>
          <button type="button" className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMobileMenuOpen(false)} aria-label="Close sidebar">×</button>
        </div>
        <div className="border-b border-slate-200 px-5 py-5"><div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-900 text-sm font-bold text-white shadow-sm">{photoUrl ? <img src={photoUrl} alt={name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : initials}</div>
          <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{name}</p><p className="truncate text-xs text-slate-500">Teacher Account</p></div>
        </div></div>
        <nav className="flex-1 overflow-y-auto px-4 py-5"><p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Teacher Portal</p><div className="space-y-1">
          {navItems.map((item) => <NavLink key={item.path} to={item.path} end={item.end} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-current/10 text-base">{item.icon}</span>{item.label}</NavLink>)}
        </div></nav>
        <div className="border-t border-slate-200 p-4"><button type="button" onClick={clearTeacherSession} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">↪</span>Go to Login</button></div>
      </aside>
      <div className="lg:pl-72"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3"><button type="button" onClick={() => setMobileMenuOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden" aria-label="Open menu">☰</button><div><p className="text-xs font-medium text-slate-500">Teacher Portal</p><h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1></div></div>
        <div className="hidden items-center gap-3 sm:flex"><div className="text-right"><p className="text-sm font-semibold text-slate-900">{name}</p><p className="text-xs text-slate-500">{teacher?.email || ""}</p></div><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-900 text-sm font-bold text-white shadow-sm">{photoUrl ? <img src={photoUrl} alt={name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : initials}</div></div>
      </div></header><main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main></div>
    </div>
  );
}
