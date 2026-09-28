import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCalendar, FiRefreshCw } from "react-icons/fi";

import { getAllTeachers } from "../../services/teacherService";
import { markTeacherAttendance } from "../../services/teacherAttendanceService";

const STATUS_OPTIONS = ["Present", "Absent", "Leave"];

const getPhotoUrl = (photo) => {
  if (!photo) return "";

  if (/^https?:\/\//i.test(photo)) {
    return photo;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

  return `${baseUrl}/${String(photo).replace(/^\/+/, "")}`;
};

const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const initialForm = {
  teacher: "",
  status: "Present",
  date: getToday(),
};

function MarkTeacherAttendanceForm({ onSuccess }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    data: teachersData,
    isLoading: teachersLoading,
  } = useQuery({
    queryKey: ["teachers", "attendance-select"],
    queryFn: getAllTeachers,
  });

  const teachers = useMemo(
    () => teachersData?.teachers || teachersData?.data || [],
    [teachersData],
  );

  const filteredTeachers = useMemo(() => {
    const search = teacherSearch.trim().toLowerCase();

    if (!search) {
      return teachers;
    }

    return teachers.filter((teacher) => {
      const name =
        `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim();

      return (
        name.toLowerCase().includes(search) ||
        String(teacher.employeeId || "")
          .toLowerCase()
          .includes(search) ||
        String(teacher.email || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [teachers, teacherSearch]);

  const mutation = useMutation({
    mutationFn: markTeacherAttendance,
    onSuccess: async () => {
      setForm((current) => ({
        ...current,
        teacher: "",
      }));
      setTeacherSearch("");
      setErrorMessage("");

      await queryClient.invalidateQueries({
        queryKey: ["teacher-attendance"],
      });

      onSuccess?.();
    },
    onError: (error) => {
      setErrorMessage(
        error?.response?.data?.message ||
          "Unable to mark teacher attendance. Please try again.",
      );
    },
  });

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher._id === form.teacher),
    [teachers, form.teacher],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!form.teacher) {
      setErrorMessage("Please select a teacher.");
      return;
    }

    if (!form.date) {
      setErrorMessage("Please select an attendance date.");
      return;
    }

    mutation.mutate({
      teacher: form.teacher,
      status: form.status,
      date: form.date,
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setTeacherSearch("");
    setErrorMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            Mark Teacher Attendance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Record attendance for an active teacher.
          </p>
        </div>

        <FiCalendar className="h-5 w-5 text-slate-400" />
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label
            htmlFor="teacher-attendance-search"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Search Teacher
          </label>

          <input
            id="teacher-attendance-search"
            type="search"
            value={teacherSearch}
            onChange={(event) => setTeacherSearch(event.target.value)}
            placeholder="Search by name, employee ID, or email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="teacher-attendance-teacher"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Teacher
          </label>

          <div className="space-y-2">
            {teachersLoading ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                Loading teachers...
              </div>
            ) : !teacherSearch.trim() ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                Start typing to search for a teacher.
              </p>
            ) : filteredTeachers.length ? (
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {filteredTeachers.map((teacher) => {
                  const name =
                    `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim();

                  const isSelected = form.teacher === teacher._id;

                  return (
                    <button
                      key={teacher._id}
                      type="button"
                      onClick={() =>
                        handleChange({
                          target: {
                            name: "teacher",
                            value: teacher._id,
                          },
                        })
                      }
                      className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {teacher.photo ? (
                        <img
                          src={getPhotoUrl(teacher.photo)}
                          alt={name || "Teacher"}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                          {(teacher.firstName || "T").charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {name || "Unnamed Teacher"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {teacher.employeeId || teacher.email || "No ID"}
                        </p>
                      </div>

                      {isSelected ? (
                        <span className="text-xs font-semibold text-indigo-600">
                          Selected
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                No teachers found.
              </p>
            )}
          </div>

          {selectedTeacher ? (
            <p className="mt-1.5 text-xs text-slate-500">
              {selectedTeacher.email || "No email available"}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="teacher-attendance-date"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Attendance Date
          </label>

          <input
            id="teacher-attendance-date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="teacher-attendance-status"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Status
          </label>

          <select
            id="teacher-attendance-status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={resetForm}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw className="h-4 w-4" />
          Reset
        </button>

        <button
          type="submit"
          disabled={mutation.isPending || teachersLoading}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Mark Attendance"}
        </button>
      </div>
    </form>
  );
}

export default MarkTeacherAttendanceForm;
