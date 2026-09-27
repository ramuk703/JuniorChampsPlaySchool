import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiSave,
} from "react-icons/fi";

import { getStudents } from "../../services/studentService";
import { markAttendance } from "../../services/attendanceService";

const getToday = () => {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

function MarkAttendanceForm({ onSuccess }) {
  const [form, setForm] = useState({
    date: getToday(),
    studentId: "",
    status: "Present",
  });

  const [studentSearch, setStudentSearch] = useState("");

  const {
    data: studentsData,
    isLoading: isStudentsLoading,
    isError: isStudentsError,
    error: studentsError,
  } = useQuery({
    queryKey: ["students", "attendance-select", studentSearch],
    queryFn: () =>
      getStudents({
        page: 1,
        limit: 100,
        search: studentSearch,
      }),
  });

  const students = useMemo(
    () => studentsData?.students || [],
    [studentsData?.students],
  );

  const selectedStudent = useMemo(
    () => students.find((student) => student._id === form.studentId),
    [students, form.studentId],
  );

  const mutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: (response) => {
      setForm((current) => ({
        ...current,
        studentId: "",
        status: "Present",
      }));

      setStudentSearch("");

      if (onSuccess) {
        onSuccess(response);
      }
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    mutation.reset();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.studentId || !form.date || !form.status) {
      return;
    }

    mutation.mutate({
      studentId: form.studentId,
      date: form.date,
      status: form.status,
      ...(selectedStudent?.className
        ? { className: selectedStudent.className }
        : {}),
    });
  };

  const errorMessage =
    mutation.error?.response?.data?.message ||
    mutation.error?.message ||
    studentsError?.response?.data?.message ||
    studentsError?.message ||
    "";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="mark-attendance-date"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Attendance Date
          </label>

          <input
            id="mark-attendance-date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="attendance-student-search"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Search Student
          </label>

          <input
            id="attendance-student-search"
            type="text"
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
            placeholder="Name, admission no., class..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="attendance-student"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Student
          </label>

          <select
            id="attendance-student"
            name="studentId"
            value={form.studentId}
            onChange={handleChange}
            required
            disabled={isStudentsLoading}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
          >
            <option value="">
              {isStudentsLoading
                ? "Loading students..."
                : "Select a student"}
            </option>

            {students.map((student) => {
              const fullName =
                `${student.firstName || ""} ${student.lastName || ""}`.trim();

              return (
                <option key={student._id} value={student._id}>
                  {fullName || "Unnamed Student"} —{" "}
                  {student.admissionNo || "No admission no."}
                </option>
              );
            })}
          </select>

          {!isStudentsLoading && !students.length && (
            <p className="mt-1.5 text-xs text-slate-500">
              No students found.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="attendance-status"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Status
          </label>

          <select
            id="attendance-status"
            name="status"
            value={form.status}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
          </select>
        </div>
      </div>

      {selectedStudent && (
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            {selectedStudent.firstName} {selectedStudent.lastName}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Class: {selectedStudent.className || "—"}
            {selectedStudent.section
              ? ` • Section: ${selectedStudent.section}`
              : ""}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <FiAlertCircle className="mt-0.5 shrink-0 text-lg text-red-600" />

          <div>
            <p className="text-sm font-semibold text-red-800">
              Unable to mark attendance
            </p>

            <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {mutation.isSuccess && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          <FiCheckCircle />
          Attendance marked successfully.
        </div>
      )}

      {isStudentsError && !errorMessage && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle />
          Unable to load students.
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={
            mutation.isPending ||
            isStudentsLoading ||
            !form.studentId ||
            !form.date
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? (
            <>
              <FiLoader className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FiSave />
              Mark Attendance
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default MarkAttendanceForm;
