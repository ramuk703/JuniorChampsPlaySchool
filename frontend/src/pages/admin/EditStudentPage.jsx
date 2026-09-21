import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiAlertCircle, FiArrowLeft, FiRefreshCw } from "react-icons/fi";

import StudentForm from "../../components/students/StudentForm";
import {
  getStudent,
  updateStudent,
} from "../../services/studentService";

const formatDateForInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const getPhotoUrl = (photo) => {
  if (!photo) {
    return "";
  }

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

function EditStudentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["student", id],
    queryFn: () => getStudent(id),
    enabled: Boolean(id),
  });

  const student = data?.student;

  const defaultValues = useMemo(() => {
    if (!student) {
      return undefined;
    }

    return {
      admissionNo: student.admissionNo || "",
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      gender: student.gender || "",
      dob: formatDateForInput(student.dob),
      className: student.className || "",
      section: student.section || "A",
      fatherName: student.fatherName || "",
      motherName: student.motherName || "",
      mobile: student.mobile || "",
      email: student.email || "",
      address: student.address || "",
      bloodGroup: student.bloodGroup || "",
      transport: Boolean(student.transport),
      status: student.status || "Active",
    };
  }, [student]);

  const initialPhoto = useMemo(
    () => getPhotoUrl(student?.photo || student?.studentPhoto),
    [student],
  );

  const mutation = useMutation({
    mutationFn: (formData) => updateStudent(id, formData),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["students"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["student", id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "stats"],
        }),
      ]);

      navigate("/admin/students", {
        replace: true,
        state: { updated: true },
      });
    },

    onError: (requestError) => {
      setSubmitError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          requestError.message ||
          "Unable to update student.",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          Loading student...
        </p>
      </div>
    );
  }

  if (isError || !student || !defaultValues) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Student could not be loaded.";

    return (
      <div className="space-y-6">
        <Link
          to="/admin/students"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <FiArrowLeft size={16} />
          Back to Students
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex gap-3">
            <FiAlertCircle
              size={22}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h1 className="font-semibold text-red-800">
                Unable to load student
              </h1>

              <p className="mt-1 text-sm text-red-700">
                {message}
              </p>

              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                <FiRefreshCw size={16} />
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StudentForm
      mode="edit"
      defaultValues={defaultValues}
      initialPhoto={initialPhoto}
      onSubmit={(formData) => {
        setSubmitError("");
        mutation.mutate(formData);
      }}
      isSubmitting={mutation.isPending}
      error={submitError}
    />
  );
}

export default EditStudentPage;