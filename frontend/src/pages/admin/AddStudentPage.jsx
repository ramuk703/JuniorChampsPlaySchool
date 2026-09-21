import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import StudentForm from "../../components/students/StudentForm";
import { createStudent } from "../../services/studentService";

function AddStudentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState("");

  const mutation = useMutation({
    mutationFn: createStudent,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["students"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "stats"],
        }),
      ]);

      navigate("/admin/students", {
        replace: true,
        state: { created: true },
      });
    },

    onError: (error) => {
      setSubmitError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Unable to create student.",
      );
    },
  });

  return (
    <StudentForm
      mode="create"
      onSubmit={(formData) => {
        setSubmitError("");
        mutation.mutate(formData);
      }}
      isSubmitting={mutation.isPending}
      error={submitError}
    />
  );
}

export default AddStudentPage;
