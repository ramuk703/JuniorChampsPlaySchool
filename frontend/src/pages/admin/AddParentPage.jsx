import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import ParentForm from "../../components/parents/ParentForm";
import { getStudents } from "../../services/studentService";
import { createParent } from "../../services/parentService";

function AddParentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: studentsData,
    isLoading: studentsLoading,
  } = useQuery({
    queryKey: ["students", "parent-select"],
    queryFn: () =>
      getStudents({
        page: 1,
        limit: 100,
      }),
  });

  const students = Array.isArray(studentsData?.students)
    ? studentsData.students.filter(
        (student) => student.deletedAt == null
      )
    : [];

  const createMutation = useMutation({
    mutationFn: createParent,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["parents"],
      });

      navigate("/admin/parents");
    },
  });

  const error =
    createMutation.error?.response?.data?.message ||
    createMutation.error?.message ||
    "";

  return (
    <ParentForm
      mode="create"
      students={students}
      studentsLoading={studentsLoading}
      onSubmit={(values) => createMutation.mutate(values)}
      isSubmitting={createMutation.isPending}
      error={error}
    />
  );
}

export default AddParentPage;
