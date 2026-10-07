import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowLeft, FiMail } from "react-icons/fi";
import { Link } from "react-router-dom";

import { forgotPassword } from "../../services/passwordResetService";

function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async ({ email }) => {
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await forgotPassword(email);

      setSuccess(
        response.message ||
          "If an account with that email exists, a password reset link has been sent.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to process your request. Please try again.",
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
          Forgot Password
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          Enter your email address and we&apos;ll send you a password reset
          link.
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
            htmlFor="forgot-email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Email address
          </label>

          <div className="relative">
            <FiMail
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              aria-invalid={Boolean(errors.email)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              {...register("email", {
                required: "Email address is required.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address.",
                },
              })}
            />
          </div>

          {errors.email ? (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <Link
          to="/auth/login"
          className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to Admin Login
        </Link>
      </form>
    </section>
  );
}

export default ForgotPasswordPage;
