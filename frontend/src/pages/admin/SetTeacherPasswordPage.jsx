import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { setTeacherPassword } from "../../services/teacherAuthService";

export default function SetTeacherPasswordPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8 || password.length > 128) {
      setError("Password must contain 8–128 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const result = await setTeacherPassword({
        teacherId: id,
        password,
      });
      setSuccess(result.message || "Password assigned successfully.");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Could not assign password."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 p-4 sm:p-8">
      <Link to="/admin/teachers" className="text-sm text-indigo-600 hover:underline">
        ← Back to Teachers
      </Link>
      <section className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Set Teacher Password
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Set an initial password or reset the password for this teacher.
          Give the password to the teacher privately.
        </p>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="new-teacher-password" className="block text-sm font-medium">
              New password
            </label>
            <input
              id="new-teacher-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label htmlFor="confirm-teacher-password" className="block text-sm font-medium">
              Confirm password
            </label>
            <input
              id="confirm-teacher-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border p-3"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving..." : "Set / Reset Password"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/teachers")}
            className="w-full rounded-lg border px-4 py-3"
          >
            Back to Teachers
          </button>
        </form>
      </section>
    </main>
  );
}
