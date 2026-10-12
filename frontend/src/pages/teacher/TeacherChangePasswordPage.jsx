import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { changeTeacherPassword } from "../../services/teacherAuthService";
import { clearTeacherAuth } from "../../store/teacherAuthSlice";

export default function TeacherChangePasswordPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8 || newPassword.length > 128) {
      setError("New password must contain 8–128 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("New password must differ from the current password.");
      return;
    }

    setBusy(true);
    try {
      await changeTeacherPassword({ currentPassword, newPassword });
      dispatch(clearTeacherAuth());
      navigate("/teacher/login", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Could not change password."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 p-4 sm:p-8">
      <Link to="/teacher" className="text-sm text-indigo-600 hover:underline">
        ← Back to Dashboard
      </Link>
      <section className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
        <p className="mt-2 text-sm text-slate-600">
          After a successful change, sign in again using your new password.
        </p>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium">
              Confirm new password
            </label>
            <input
              id="confirm-password"
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
            {busy ? "Changing..." : "Change Password"}
          </button>
        </form>
      </section>
    </main>
  );
}
