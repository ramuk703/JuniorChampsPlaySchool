import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

import { changeParentPassword } from "../../services/parentAuthService";

function PasswordField({
  id,
  label,
  autoComplete,
  placeholder,
  register,
  error,
  showPassword,
  onToggle,
  registerOptions,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <FiLock
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
        />

        <input
          id={id}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          {...register(id, registerOptions)}
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          aria-label={showPassword ? `Hide ${label}` : `Show ${label}`}
        >
          {showPassword ? (
            <FiEyeOff aria-hidden="true" />
          ) : (
            <FiEye aria-hidden="true" />
          )}
        </button>
      </div>

      {error ? (
        <p className="mt-1.5 text-sm text-red-600">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}

function ParentPasswordPage() {
  const navigate = useNavigate();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = getValues("newPassword");

  const onSubmit = async (values) => {
    setSubmitError("");
    setSuccessMessage("");

    try {
      const response = await changeParentPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      setSuccessMessage(
        response?.message || "Password changed successfully.",
      );

      reset();

      // The backend invalidates the previous parent session after
      // a successful password change, so return to the login page.
      setTimeout(() => {
        navigate("/parent/login", { replace: true });
      }, 1200);
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to change password.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/parent"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to Dashboard
        </Link>

        <p className="mt-6 text-sm font-medium text-indigo-600">
          Parent Portal
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Change Password
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Update your parent account password securely.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 p-6 sm:p-8"
          noValidate
        >
          {submitError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {submitError}
            </div>
          ) : null}

          {successMessage ? (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          ) : null}

          <PasswordField
            id="currentPassword"
            label="Current Password"
            autoComplete="current-password"
            placeholder="Enter current password"
            register={register}
            error={errors.currentPassword}
            showPassword={showCurrentPassword}
            onToggle={() =>
              setShowCurrentPassword((visible) => !visible)
            }
            registerOptions={{
              required: "Current password is required.",
            }}
          />

          <PasswordField
            id="newPassword"
            label="New Password"
            autoComplete="new-password"
            placeholder="Enter new password"
            register={register}
            error={errors.newPassword}
            showPassword={showNewPassword}
            onToggle={() => setShowNewPassword((visible) => !visible)}
            registerOptions={{
              required: "New password is required.",
              minLength: {
                value: 8,
                message: "Password must contain 8–128 characters.",
              },
              maxLength: {
                value: 128,
                message: "Password must contain 8–128 characters.",
              },
            }}
          />

          <p className="-mt-3 text-sm text-slate-500">
            Password must contain 8–128 characters.
          </p>

          <PasswordField
            id="confirmPassword"
            label="Confirm New Password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            register={register}
            error={errors.confirmPassword}
            showPassword={showConfirmPassword}
            onToggle={() =>
              setShowConfirmPassword((visible) => !visible)
            }
            registerOptions={{
              required: "Please confirm your new password.",
              validate: (value) =>
                value === newPassword || "Passwords do not match.",
            }}
          />

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/parent")}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Changing Password..." : "Change Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ParentPasswordPage;
