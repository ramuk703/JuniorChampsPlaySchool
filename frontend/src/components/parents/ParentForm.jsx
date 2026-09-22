import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  FiArrowLeft,
  FiSave,
  FiUser,
  FiX,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

const labelClass = "text-sm font-medium text-slate-700";

const DEFAULT_VALUES = {
  fatherName: "",
  motherName: "",
  email: "",
  mobile: "",
  password: "",
  address: "",
  student: "",
};

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1 text-xs font-medium text-red-600">
      {message}
    </p>
  );
}

const getStudentName = (student) => {
  const name = [student.firstName, student.lastName]
    .filter(Boolean)
    .join(" ");

  return name || student.admissionNo || "Unnamed Student";
};

function ParentForm({
  mode = "create",
  defaultValues = DEFAULT_VALUES,
  students = [],
  studentsLoading = false,
  onSubmit,
  isSubmitting = false,
  error = "",
}) {
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      ...DEFAULT_VALUES,
      ...defaultValues,
    },
  });

  useEffect(() => {
    reset({
      ...DEFAULT_VALUES,
      ...defaultValues,
    });
  }, [defaultValues, reset]);

  const submitForm = (values) => {
    const payload = {
      fatherName: values.fatherName.trim(),
      motherName: values.motherName.trim(),
      email: values.email.trim(),
      mobile: values.mobile.trim(),
      address: values.address.trim(),
      student: values.student,
    };

    if (values.password.trim()) {
      payload.password = values.password;
    }

    onSubmit(payload);
  };

  return (
    <div className="space-y-6">
      <section>
        <Link
          to="/admin/parents"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <FiArrowLeft size={16} />
          Back to Parents
        </Link>

        <p className="mt-4 text-sm font-medium text-slate-500">
          Administration
        </p>

        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          <FiUser size={27} />
          {isEdit ? "Edit Parent" : "Add Parent"}
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          {isEdit
            ? "Update the parent's information and linked student."
            : "Create a parent account and link it to a student."}
        </p>
      </section>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <FiX className="mt-0.5 shrink-0" size={18} />

          <div>
            <p className="font-semibold">
              Unable to save parent
            </p>

            <p className="mt-1 text-red-700">
              {error}
            </p>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit(submitForm)}
        className="space-y-6"
      >
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-semibold text-slate-900">
              Parent Information
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Enter the parent or guardian's contact information.
            </p>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Father Name *
              </label>

              <input
                {...register("fatherName", {
                  required: "Father name is required.",
                  minLength: {
                    value: 2,
                    message:
                      "Father name must contain at least 2 characters.",
                  },
                  maxLength: {
                    value: 100,
                    message:
                      "Father name cannot exceed 100 characters.",
                  },
                })}
                className={inputClass}
                placeholder="Samay Singh"
              />

              <FieldError message={errors.fatherName?.message} />
            </div>

            <div>
              <label className={labelClass}>
                Mother Name *
              </label>

              <input
                {...register("motherName", {
                  required: "Mother name is required.",
                  minLength: {
                    value: 2,
                    message:
                      "Mother name must contain at least 2 characters.",
                  },
                  maxLength: {
                    value: 100,
                    message:
                      "Mother name cannot exceed 100 characters.",
                  },
                })}
                className={inputClass}
                placeholder="Sunita Singh"
              />

              <FieldError message={errors.motherName?.message} />
            </div>

            <div>
              <label className={labelClass}>
                Email *
              </label>

              <input
                type="email"
                {...register("email", {
                  required: "Email address is required.",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address.",
                  },
                })}
                className={inputClass}
                placeholder="parent@example.com"
              />

              <FieldError message={errors.email?.message} />
            </div>

            <div>
              <label className={labelClass}>
                Mobile Number *
              </label>

              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                {...register("mobile", {
                  required: "Mobile number is required.",
                  pattern: {
                    value: /^\d{10}$/,
                    message:
                      "Mobile number must contain exactly 10 digits.",
                  },
                })}
                className={inputClass}
                placeholder="9876543210"
              />

              <FieldError message={errors.mobile?.message} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>
                {isEdit ? "New Password" : "Password *"}
              </label>

              <input
                type="password"
                autoComplete="new-password"
                {...register("password", {
                  required: isEdit
                    ? false
                    : "Password is required.",
                  minLength: {
                    value: 8,
                    message:
                      "Password must contain at least 8 characters.",
                  },
                  maxLength: {
                    value: 128,
                    message:
                      "Password cannot exceed 128 characters.",
                  },
                })}
                className={inputClass}
                placeholder={
                  isEdit
                    ? "Leave blank to keep the current password"
                    : "Minimum 8 characters"
                }
              />

              <FieldError message={errors.password?.message} />

              {isEdit ? (
                <p className="mt-1 text-xs text-slate-500">
                  Leave this field blank if the password should remain
                  unchanged.
                </p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>
                Address *
              </label>

              <textarea
                rows={4}
                {...register("address", {
                  required: "Address is required.",
                  minLength: {
                    value: 2,
                    message:
                      "Address must contain at least 2 characters.",
                  },
                  maxLength: {
                    value: 300,
                    message:
                      "Address cannot exceed 300 characters.",
                  },
                })}
                className={inputClass}
                placeholder="Enter complete residential address"
              />

              <FieldError message={errors.address?.message} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-semibold text-slate-900">
              Linked Student
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Select the student associated with this parent account.
            </p>
          </div>

          <div className="mt-5">
            <label className={labelClass}>
              Student *
            </label>

            <select
              {...register("student", {
                required: "Please select a student.",
              })}
              disabled={studentsLoading}
              className={inputClass}
            >
              <option value="">
                {studentsLoading
                  ? "Loading students..."
                  : "Select a student"}
              </option>

              {students.map((student) => (
                <option
                  key={student._id}
                  value={student._id}
                >
                  {getStudentName(student)}
                  {student.admissionNo
                    ? ` — ${student.admissionNo}`
                    : ""}
                  {student.className
                    ? ` — ${student.className}${
                        student.section
                          ? `-${student.section}`
                          : ""
                      }`
                    : ""}
                </option>
              ))}
            </select>

            <FieldError message={errors.student?.message} />

            {!studentsLoading && students.length === 0 ? (
              <p className="mt-2 text-xs font-medium text-amber-600">
                No active students are currently available.
              </p>
            ) : null}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/admin/parents"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || studentsLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSave size={17} />

            {isSubmitting
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Create Parent"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ParentForm;
