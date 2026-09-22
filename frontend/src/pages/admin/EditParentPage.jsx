import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import ParentForm from "../../components/parents/ParentForm";
import { getStudents } from "../../services/studentService";
import {
  getParentById,
  updateParent,
} from "../../services/parentService";

function EditParentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: parentData,
    isLoading: parentLoading,
    isError: parentError,
    error: parentQueryError,
  } = useQuery({
    queryKey: ["parents", "detail", id],
    queryFn: () => getParentById(id),
    enabled: Boolean(id),
  });

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

  const parent = parentData?.parent;

  const updateMutation = useMutation({
    mutationFn: updateParent,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["parents"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["parents", "detail", id],
      });

      navigate("/admin/parents");
    },
  });

  if (parentLoading || studentsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-9 w-52 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-80 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (parentError || !parent) {
    const errorMessage =
      parentQueryError?.response?.data?.message ||
      parentQueryError?.message ||
      "The requested parent could not be loaded.";

    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <h1 className="font-semibold text-red-800">
          Unable to load parent
        </h1>

        <p className="mt-1 text-sm text-red-700">
          {errorMessage}
        </p>

        <button
          type="button"
          onClick={() => navigate("/admin/parents")}
          className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100"
        >
          Back to Parents
        </button>
      </div>
    );
  }

  const defaultValues = {
    fatherName: parent.fatherName || "",
    motherName: parent.motherName || "",
    email: parent.email || "",
    mobile: parent.mobile || "",
    password: "",
    address: parent.address || "",
    student:
      typeof parent.student === "object"
        ? parent.student?._id || ""
        : parent.student || "",
  };

  const error =
    updateMutation.error?.response?.data?.message ||
    updateMutation.error?.message ||
    "";

  return (
    <ParentForm
      mode="edit"
      defaultValues={defaultValues}
      students={students}
      studentsLoading={studentsLoading}
      onSubmit={(values) =>
        updateMutation.mutate({
          parentId: id,
          parentData: values,
        })
      }
      isSubmitting={updateMutation.isPending}
      error={error}
    />
  );
}

export default EditParentPage;
