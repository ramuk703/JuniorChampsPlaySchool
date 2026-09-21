import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { clearAuthError, login } from "../../store/authSlice";

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth,
  );

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      const destination = location.state?.from?.pathname || "/admin";

      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, location.state, navigate]);

  const onSubmit = async (values) => {
    const result = await dispatch(login(values));

    if (login.fulfilled.match(result)) {
      const destination = location.state?.from?.pathname || "/admin";

      navigate(destination, { replace: true });
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
      <div className="bg-slate-900 px-6 py-8 text-white sm:px-8">
        <p className="text-sm font-medium text-slate-300">
          Junior Champ&apos;s Play School
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Admin Login
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          Sign in to manage the school administration portal.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6 sm:p-8"
        noValidate
      >
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
            htmlFor="email"
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
              id="email"
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

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Password
          </label>

          <div className="relative">
            <FiLock
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-12 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              {...register("password", {
                required: "Password is required.",
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

          {errors.password ? (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}

export default LoginPage;
