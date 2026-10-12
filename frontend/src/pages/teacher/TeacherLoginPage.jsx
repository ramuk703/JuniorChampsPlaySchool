import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginTeacher } from "../../store/teacherAuthSlice";
export default function TeacherLoginPage() {
  const dispatch = useDispatch(); const navigate = useNavigate(); const location = useLocation();
  const { isAuthenticated, loading, error } = useSelector((state) => state.teacherAuth);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  if (isAuthenticated) return <Navigate to="/teacher" replace />;
  const submit = async (event) => {
    event.preventDefault();
    const result = await dispatch(loginTeacher({ email: email.trim(), password }));
    if (loginTeacher.fulfilled.match(result)) navigate(location.state?.from?.pathname || "/teacher", { replace: true });
  };
  return <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
    <form onSubmit={submit} className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Junior Champs Play School</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Teacher Portal</h1>
      <p className="mt-2 text-sm text-slate-600">Sign in with your staff account.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <label htmlFor="teacher-email" className="mt-6 block text-sm font-medium">Email address</label>
      <input id="teacher-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" />
      <label htmlFor="teacher-password" className="mt-4 block text-sm font-medium">Password</label>
      <input id="teacher-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" />
      <button disabled={loading} className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button>
      <p className="mt-4 text-sm text-slate-600">Forgot your password? <Link className="text-indigo-600 hover:underline" to="/auth/forgot-password">Reset it here</Link></p>
      <p className="mt-3 text-center text-sm"><Link className="text-slate-500 hover:underline" to="/">Back to website</Link></p>
    </form>
  </main>;
}
