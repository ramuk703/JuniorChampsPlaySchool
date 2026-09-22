import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import TeacherForm from "../../components/teachers/TeacherForm";
import {
  getTeacher,
  updateTeacher,
} from "../../services/teacherService";

const EditTeacherPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["teacher", id],
    queryFn: () => getTeacher(id),
    enabled: Boolean(id),
  });

  const updateMutation = useMutation({
    mutationFn: (formData) => updateTeacher(id, formData),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["teacher", id],
      });

      await queryClient.invalidateQueries({
        queryKey: ["deleted-teachers"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "stats"],
      });

      navigate("/admin/teachers");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading teacher...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-700">
          Failed to load teacher
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error?.response?.data?.message ||
            error?.message ||
            "Unable to load teacher."}
        </p>

        <button
          type="button"
          onClick={() => navigate("/admin/teachers")}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Back to Teachers
        </button>
      </div>
    );
  }

  const teacher = data?.teacher;

  if (!teacher) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <p className="text-sm text-yellow-800">
          Teacher record not found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Teacher
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Update teacher information and photo.
        </p>
      </div>

      <TeacherForm
        initialData={teacher}
        onSubmit={updateMutation.mutateAsync}
        isSubmitting={updateMutation.isPending}
        serverError={
          updateMutation.error?.response?.data?.message ||
          updateMutation.error?.message ||
          ""
        }
      />
    </div>
  );
};

export default EditTeacherPage;
