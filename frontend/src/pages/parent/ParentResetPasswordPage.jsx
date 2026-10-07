import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowLeft, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { resetParentPassword } from "../../services/parentAuthService";

function ParentResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async ({ newPassword: password }) => {
    if (!token) {
      setError("This password reset link is invalid or missing its token.");
      return;
    }

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await resetParentPassword({
        token,
        newPassword: password,
      });

      setSuccess(
        response.message || "Password reset successfully.",
      );

      setTimeout(() => {
        navigate("/parent/login", { replace: true });
      }, 1500);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to reset your password. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
      <div className="bg-slate-900 px-6 py-8 text-white sm:px-8">
        <p className="text-sm font-medium text-slate-300">
          Junior Champ&apos;s Play School
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Reset Password
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          Create a new password for your parent account.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6 sm:p-8"
        noValidate
      >
        {success ? (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        <div>
          <label
            htmlFor="parent-reset-password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            New password
          </label>

          <div className="relative">
            <FiLock
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="parent-reset-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter new password"
              aria-invalid={Boolean(errors.newPassword)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-12 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              {...register("newPassword", {
                required: "New password is required.",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters.",
                },
                maxLength: {
                  value: 128,
                  message: "Password must not exceed 128 characters.",
                },
              })}
            />

            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {errors.newPassword ? (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.newPassword.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="parent-reset-confirm-password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Confirm new password
          </label>

          <div className="relative">
            <FiLock
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="parent-reset-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm new password"
              aria-invalid={Boolean(errors.confirmPassword)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-12 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              {...register("confirmPassword", {
                required: "Please confirm your new password.",
                validate: (value) =>
                  value === getValues("newPassword") ||
                  "Passwords do not match.",
              })}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((visible) => !visible)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label={
                showConfirmPassword
                  ? "Hide confirmation password"
                  : "Show confirmation password"
              }
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {errors.confirmPassword ? (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <Link
          to="/parent/login"
          className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to Parent Login
        </Link>
      </form>
    </section>
  );
}

export default ParentResetPasswordPage;
