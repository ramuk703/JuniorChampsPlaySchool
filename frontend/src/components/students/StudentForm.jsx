import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiArrowLeft,
  FiImage,
  FiSave,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

const labelClass = "text-sm font-medium text-slate-700";

function FieldError({ message }) {
  if (!message) return null;

  return (
    <p className="mt-1 text-xs font-medium text-red-600">
      {message}
    </p>
  );
}

const DEFAULT_VALUES = {
  admissionNo: "",
  firstName: "",
  lastName: "",
  gender: "",
  dob: "",
  className: "",
  section: "A",
  fatherName: "",
  motherName: "",
  mobile: "",
  email: "",
  address: "",
  bloodGroup: "",
  transport: false,
  status: "Active",
};

function StudentForm({
  mode = "create",
  defaultValues = DEFAULT_VALUES,
  initialPhoto = "",
  onSubmit,
  isSubmitting = false,
  error = "",
}) {
  const navigateBack = "/admin/students";
  const isEdit = mode === "edit";

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(initialPhoto || "");

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
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

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    clearErrors("studentPhoto");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("studentPhoto", {
        type: "validate",
        message: "Only JPG, JPEG, PNG or WebP images are allowed.",
      });

      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("studentPhoto", {
        type: "validate",
        message: "Student photo must be 2 MB or smaller.",
      });

      event.target.value = "";
      return;
    }

    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setPhotoFile(file);
    setPhotoPreview(previewUrl);

    setValue("studentPhoto", file, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const removePhoto = () => {
    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(null);
    setPhotoPreview("");

    setValue("studentPhoto", null, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (!isEdit) {
      setError("studentPhoto", {
        type: "required",
        message: "Student photo is required.",
      });
    } else {
      clearErrors("studentPhoto");
    }
  };

  const submitForm = (values) => {
    if (!isEdit && !photoFile) {
      setError("studentPhoto", {
        type: "required",
        message: "Student photo is required.",
      });

      return;
    }

    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === "studentPhoto") {
        return;
      }

      if (key === "transport") {
        formData.append(key, value ? "true" : "false");
        return;
      }

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        formData.append(key, value);
      }
    });

    if (photoFile) {
      formData.append("studentPhoto", photoFile);
    }

    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <section>
        <Link
          to={navigateBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <FiArrowLeft size={16} />
          Back to Students
        </Link>

        <p className="mt-4 text-sm font-medium text-slate-500">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {isEdit ? "Edit Student" : "Add Student"}
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          {isEdit
            ? "Update the student's information and save the changes."
            : "Register a new student and save their information securely."}
        </p>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <FiX className="mt-0.5 shrink-0" size={18} />

          <div>
            <p className="font-semibold">
              Unable to save student
            </p>

            <p className="mt-1 text-red-700">
              {error}
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit(submitForm)}
        className="space-y-6"
      >
        {/* Photo */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-slate-900">
              Student Photo
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              JPG, JPEG, PNG or WebP. Maximum size 2 MB.
              {isEdit ? " Leave unchanged to keep the existing photo." : ""}
            </p>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
              {photoPreview ? (
                <img
                  src={
                    photoPreview.startsWith("blob:") || photoPreview.startsWith("http")
                      ? photoPreview
                      : `${import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:5000"}/${photoPreview.replace(/^\/+/, "")}`
                  }
                  alt="Student preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <FiImage
                  size={30}
                  className="text-slate-300"
                />
              )}
            </div>

            <div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                  <FiUpload size={16} />
                  Choose Photo

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handlePhotoChange}
                  />
                </label>

                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <FiX size={16} />
                    Remove
                  </button>
                )}
              </div>

              <FieldError message={errors.studentPhoto?.message} />
            </div>
          </div>
        </section>

        {/* Student information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-slate-900">
            Student Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Admission Number *
              </label>

              <input
                {...register("admissionNo", {
                  required: "Admission number is required.",
                  minLength: {
                    value: 2,
                    message: "Admission number is too short.",
                  },
                })}
                className={inputClass}
                placeholder="ADM-2026-001"
              />

              <FieldError message={errors.admissionNo?.message} />
            </div>

            <div>
              <label className={labelClass}>
                First Name *
              </label>

              <input
                {...register("firstName", {
                  required: "First name is required.",
                  minLength: {
                    value: 2,
                    message:
                      "First name must contain at least 2 characters.",
                  },
                })}
                className={inputClass}
                placeholder="Rahul"
              />

              <FieldError message={errors.firstName?.message} />
            </div>

            <div>
              <label className={labelClass}>
                Last Name *
              </label>

              <input
                {...register("lastName", {
                  required: "Last name is required.",
                  minLength: {
                    value: 2,
                    message:
                      "Last name must contain at least 2 characters.",
                  },
                })}
                className={inputClass}
                placeholder="Kumar"
              />

              <FieldError message={errors.lastName?.message} />
            </div>

            <div>
              <label className={labelClass}>
                Gender *
              </label>

              <select
                {...register("gender", {
                  required: "Gender is required.",
                })}
                className={inputClass}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <FieldError message={errors.gender?.message} />
            </div>

            <div>
              <label className={labelClass}>
                Date of Birth *
              </label>

              <input
                type="date"
                {...register("dob", {
                  required: "Date of birth is required.",
                  validate: (value) =>
                    new Date(value) < new Date() ||
                    "Date of birth must be in the past.",
                })}
                className={inputClass}
              />

              <FieldError message={errors.dob?.message} />
            </div>

            <div>
              <label className={labelClass}>
                Class *
              </label>

              <input
                {...register("className", {
                  required: "Class is required.",
                })}
                className={inputClass}
                placeholder="Nursery"
              />

              <FieldError message={errors.className?.message} />
            </div>

            <div>
              <label className={labelClass}>
                Section
              </label>

              <input
                {...register("section")}
                className={inputClass}
                placeholder="A"
              />
            </div>

            <div>
              <label className={labelClass}>
                Status
              </label>

              <select
                {...register("status")}
                className={inputClass}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        {/* Parent information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-slate-900">
            Parent & Contact Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Father's Name *
              </label>

              <input
                {...register("fatherName", {
                  required: "Father's name is required.",
                })}
                className={inputClass}
                placeholder="Father name"
              />

              <FieldError message={errors.fatherName?.message} />
            </div>

            <div>
              <label className={labelClass}>
                Mother's Name *
              </label>

              <input
                {...register("motherName", {
                  required: "Mother's name is required.",
                })}
                className={inputClass}
                placeholder="Mother name"
              />

              <FieldError message={errors.motherName?.message} />
            </div>

            <div>
              <label className={labelClass}>
                Mobile *
              </label>

              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                {...register("mobile", {
                  required: "Mobile number is required.",
                  pattern: {
                    value: /^\d{10}$/,
                    message: "Enter a valid 10-digit mobile number.",
                  },
                })}
                className={inputClass}
                placeholder="9876543210"
              />

              <FieldError message={errors.mobile?.message} />
            </div>

            <div>
              <label className={labelClass}>
                Email
              </label>

              <input
                type="email"
                {...register("email", {
                  validate: (value) =>
                    !value ||
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
                    "Enter a valid email address.",
                })}
                className={inputClass}
                placeholder="parent@example.com"
              />

              <FieldError message={errors.email?.message} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>
                Address *
              </label>

              <textarea
                {...register("address", {
                  required: "Address is required.",
                })}
                rows={3}
                className={inputClass}
                placeholder="Complete residential address"
              />

              <FieldError message={errors.address?.message} />
            </div>
          </div>
        </section>

        {/* Additional information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-slate-900">
            Additional Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Blood Group
              </label>

              <select
                {...register("bloodGroup")}
                className={inputClass}
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 p-3">
              <input
                type="checkbox"
                {...register("transport")}
                className="h-4 w-4 rounded border-slate-300"
              />

              <span>
                <span className="block text-sm font-medium text-slate-700">
                  School Transport
                </span>

                <span className="text-xs text-slate-500">
                  Student uses school transportation.
                </span>
              </span>
            </label>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to={navigateBack}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              "Saving..."
            ) : (
              <>
                <FiSave size={16} />
                {isEdit ? "Update Student" : "Save Student"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default StudentForm;