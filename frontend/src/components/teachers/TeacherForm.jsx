import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowLeft, FiUpload, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const getPhotoUrl = (photo) => {
  if (!photo) return "";

  if (
    photo.startsWith("http://") ||
    photo.startsWith("https://") ||
    photo.startsWith("blob:")
  ) {
    return photo;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const backendUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

  return `${backendUrl}/${photo.replace(/^\/+/, "")}`;
};

const TeacherForm = ({
  initialData = null,
  onSubmit,
  isSubmitting = false,
  serverError = "",
}) => {
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      employeeId: "",
      firstName: "",
      lastName: "",
      gender: "",
      email: "",
      mobile: "",
      qualification: "",
      experience: "",
      classTeacher: "",
      address: "",
      joiningDate: "",
      salary: "",
      status: "Active",
    },
  });

  useEffect(() => {
    if (!initialData) return;

    reset({
      employeeId: initialData.employeeId || "",
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      gender: initialData.gender || "",
      email: initialData.email || "",
      mobile: initialData.mobile || "",
      qualification: initialData.qualification || "",
      experience:
        initialData.experience !== undefined
          ? String(initialData.experience)
          : "",
      classTeacher: initialData.classTeacher || "",
      address: initialData.address || "",
      joiningDate: initialData.joiningDate
        ? String(initialData.joiningDate).slice(0, 10)
        : "",
      salary:
        initialData.salary !== undefined
          ? String(initialData.salary)
          : "",
      status: initialData.status || "Active",
    });

  }, [initialData, reset]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    setPhotoError("");

    if (!file) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setPhotoError("Only JPG, JPEG, PNG, and WebP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setPhotoError("Photo size must not exceed 2 MB.");
      event.target.value = "";
      return;
    }

    setValue("teacherPhoto", file, {
      shouldDirty: true,
    });

    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const removePhoto = () => {
    setValue("teacherPhoto", null, {
      shouldDirty: true,
    });

    setPhotoPreview("");
    setPhotoError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitForm = (data) => {
    const formData = new FormData();

    formData.append("employeeId", data.employeeId.trim());
    formData.append("firstName", data.firstName.trim());
    formData.append("lastName", data.lastName.trim());
    formData.append("gender", data.gender);
    formData.append("email", data.email.trim());
    formData.append("mobile", data.mobile.trim());
    formData.append("qualification", data.qualification.trim());
    formData.append("address", data.address.trim());
    formData.append("status", data.status || "Active");

    if (data.experience !== "") {
      formData.append("experience", data.experience);
    }

    if (data.classTeacher?.trim()) {
      formData.append("classTeacher", data.classTeacher.trim());
    }

    if (data.joiningDate) {
      formData.append("joiningDate", data.joiningDate);
    }

    if (data.salary !== "") {
      formData.append("salary", data.salary);
    }

    if (data.teacherPhoto instanceof File) {
      formData.append("teacherPhoto", data.teacherPhoto);
    }

    onSubmit(formData);
  };

  const inputClass = (fieldName) =>
    `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
      errors[fieldName]
        ? "border-red-300 focus:border-red-400 focus:ring-red-50"
        : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
    }`;

  const errorMessage = (fieldName) =>
    errors[fieldName] ? (
      <p className="mt-1 text-xs font-medium text-red-600">
        {errors[fieldName].message}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit(submitForm)} className="space-y-6">
      {serverError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {serverError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900">
            Basic Information
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter the teacher&apos;s identity and employment details.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Employee ID *
            </label>
            <input
              {...register("employeeId", {
                required: "Employee ID is required",
                minLength: {
                  value: 2,
                  message: "Employee ID must be at least 2 characters",
                },
                maxLength: {
                  value: 50,
                  message: "Employee ID must not exceed 50 characters",
                },
              })}
              placeholder="EMP001"
              className={inputClass("employeeId")}
            />
            {errorMessage("employeeId")}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Gender *
            </label>
            <select
              {...register("gender", {
                required: "Gender is required",
              })}
              className={inputClass("gender")}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errorMessage("gender")}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              First Name *
            </label>
            <input
              {...register("firstName", {
                required: "First name is required",
                minLength: {
                  value: 2,
                  message: "First name must be at least 2 characters",
                },
                maxLength: {
                  value: 50,
                  message: "First name must not exceed 50 characters",
                },
              })}
              placeholder="First name"
              className={inputClass("firstName")}
            />
            {errorMessage("firstName")}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Last Name *
            </label>
            <input
              {...register("lastName", {
                required: "Last name is required",
                minLength: {
                  value: 2,
                  message: "Last name must be at least 2 characters",
                },
                maxLength: {
                  value: 50,
                  message: "Last name must not exceed 50 characters",
                },
              })}
              placeholder="Last name"
              className={inputClass("lastName")}
            />
            {errorMessage("lastName")}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900">
            Contact Information
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Email *
            </label>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              })}
              placeholder="teacher@example.com"
              className={inputClass("email")}
            />
            {errorMessage("email")}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Mobile *
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              {...register("mobile", {
                required: "Mobile number is required",
                pattern: {
                  value: /^\d{10}$/,
                  message: "Mobile number must be exactly 10 digits",
                },
              })}
              placeholder="9876543210"
              className={inputClass("mobile")}
            />
            {errorMessage("mobile")}
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">
              Address *
            </label>
            <textarea
              rows={3}
              {...register("address", {
                required: "Address is required",
                minLength: {
                  value: 5,
                  message: "Address must be at least 5 characters",
                },
                maxLength: {
                  value: 500,
                  message: "Address must not exceed 500 characters",
                },
              })}
              placeholder="Full residential address"
              className={`${inputClass("address")} resize-y`}
            />
            {errorMessage("address")}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900">
            Professional Information
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Qualification *
            </label>
            <input
              {...register("qualification", {
                required: "Qualification is required",
                minLength: {
                  value: 2,
                  message: "Qualification must be at least 2 characters",
                },
                maxLength: {
                  value: 100,
                  message: "Qualification must not exceed 100 characters",
                },
              })}
              placeholder="B.Ed, BCA, M.Ed..."
              className={inputClass("qualification")}
            />
            {errorMessage("qualification")}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Class Teacher
            </label>
            <input
              {...register("classTeacher", {
                maxLength: {
                  value: 100,
                  message: "Class teacher value must not exceed 100 characters",
                },
              })}
              placeholder="Nursery / LKG / Class 1..."
              className={inputClass("classTeacher")}
            />
            {errorMessage("classTeacher")}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Experience (Years)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              step="0.1"
              {...register("experience", {
                min: {
                  value: 0,
                  message: "Experience cannot be negative",
                },
                max: {
                  value: 60,
                  message: "Experience cannot exceed 60 years",
                },
              })}
              placeholder="3"
              className={inputClass("experience")}
            />
            {errorMessage("experience")}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Joining Date
            </label>
            <input
              type="date"
              {...register("joiningDate")}
              className={inputClass("joiningDate")}
            />
            {errorMessage("joiningDate")}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Salary
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              {...register("salary", {
                min: {
                  value: 0,
                  message: "Salary cannot be negative",
                },
              })}
              placeholder="25000"
              className={inputClass("salary")}
            />
            {errorMessage("salary")}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Status
            </label>
            <select
              {...register("status")}
              className={inputClass("status")}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {errorMessage("status")}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900">
            Teacher Photo
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            JPG, JPEG, PNG, or WebP. Maximum size: 2 MB.
          </p>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
            {(photoPreview || getPhotoUrl(initialData?.photo)) ? (
              <img
                src={photoPreview || getPhotoUrl(initialData?.photo)}
                alt="Teacher preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-medium text-slate-400">
                No photo
              </span>
            )}
          </div>

          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FiUpload size={17} />
                {photoPreview ? "Change Photo" : "Choose Photo"}
              </button>

              {photoPreview ? (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <FiX size={17} />
                  Remove
                </button>
              ) : null}
            </div>

            {photoError ? (
              <p className="text-xs font-medium text-red-600">
                {photoError}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          to="/admin/teachers"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <FiArrowLeft size={17} />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save Teacher"}
        </button>
      </div>
    </form>
  );
};

export default TeacherForm;
