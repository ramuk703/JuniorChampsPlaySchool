import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

import TeacherForm from "../../components/teachers/TeacherForm";
import { createTeacher } from "../../services/teacherService";

const AddTeacherPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTeacher,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "stats"],
      });

      navigate("/admin/teachers");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/teachers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <FiArrowLeft size={17} />
          Back to Teachers
        </Link>

        <p className="mt-5 text-sm font-medium text-slate-500">
          Staff Management
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Add Teacher
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Create a new teacher record and optionally upload a profile photo.
        </p>
      </div>

      <TeacherForm
        onSubmit={(formData) => createMutation.mutate(formData)}
        isSubmitting={createMutation.isPending}
        serverError={
          createMutation.error?.response?.data?.message ||
          (createMutation.isError
            ? "Unable to create teacher. Please check the information and try again."
            : "")
        }
      />
    </div>
  );
};

export default AddTeacherPage;
