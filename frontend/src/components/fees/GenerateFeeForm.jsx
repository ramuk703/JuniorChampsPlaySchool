import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCreditCard, FiRefreshCw } from "react-icons/fi";

import { getStudents } from "../../services/studentService";
import { generateFee } from "../../services/feeService";

const FEE_TYPES = ["Admission", "Monthly", "Transport", "Annual", "Exam"];
const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Razorpay"];

const currentDate = new Date();

const initialForm = {
  student: "",
  month: currentDate.getMonth() + 1,
  year: currentDate.getFullYear(),
  feeType: "Monthly",
  amount: "",
  discount: "0",
  lateFee: "0",
  paymentMethod: "Cash",
  remarks: "",
};

function GenerateFeeForm({ onSuccess }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [studentSearch, setStudentSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["students", "fee-select", studentSearch],
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
    () => students.find((student) => student._id === form.student),
    [students, form.student],
  );

  const mutation = useMutation({
    mutationFn: generateFee,
    onSuccess: async () => {
      setForm(initialForm);
      setStudentSearch("");
      setErrorMessage("");

      await queryClient.invalidateQueries({
        queryKey: ["fees"],
      });

      onSuccess?.();
    },
    onError: (error) => {
      setErrorMessage(
        error?.response?.data?.message ||
          "Unable to generate fee. Please try again.",
      );
    },
  });

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

    if (!form.student) {
      setErrorMessage("Please select a student.");
      return;
    }

    if (!form.amount || Number(form.amount) < 0) {
      setErrorMessage("Please enter a valid fee amount.");
      return;
    }

    mutation.mutate({
      student: form.student,
      month: Number(form.month),
      year: Number(form.year),
      feeType: form.feeType,
      amount: Number(form.amount),
      discount: Number(form.discount || 0),
      lateFee: Number(form.lateFee || 0),
      paymentMethod: form.paymentMethod,
      ...(form.remarks.trim()
        ? { remarks: form.remarks.trim() }
        : {}),
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setStudentSearch("");
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
            Generate Fee
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create a new student fee payment record.
          </p>
        </div>

        <FiCreditCard className="h-5 w-5 text-slate-400" />
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label
            htmlFor="fee-student-search"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Search Student
          </label>

          <input
            id="fee-student-search"
            type="search"
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
            placeholder="Search by student name or admission number"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="fee-student"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Student
          </label>

          <select
            id="fee-student"
            name="student"
            value={form.student}
            onChange={handleChange}
            disabled={studentsLoading}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          >
            <option value="">
              {studentsLoading ? "Loading students..." : "Select student"}
            </option>

            {students.map((student) => {
              const name =
                `${student.firstName || ""} ${student.lastName || ""}`.trim();

              return (
                <option key={student._id} value={student._id}>
                  {name || "Unnamed Student"} — {student.admissionNo || "No ID"}
                </option>
              );
            })}
          </select>

          {selectedStudent ? (
            <p className="mt-1.5 text-xs text-slate-500">
              Class: {selectedStudent.className || "—"}{" "}
              {selectedStudent.section
                ? `• Section ${selectedStudent.section}`
                : ""}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="fee-month"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Month
          </label>

          <select
            id="fee-month"
            name="month"
            value={form.month}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {Array.from({ length: 12 }, (_, index) => {
              const month = index + 1;

              return (
                <option key={month} value={month}>
                  {new Date(2000, index, 1).toLocaleString("en-IN", {
                    month: "long",
                  })}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label
            htmlFor="fee-year"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Year
          </label>

          <input
            id="fee-year"
            name="year"
            type="number"
            min="2000"
            max="2100"
            value={form.year}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="fee-type"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Fee Type
          </label>

          <select
            id="fee-type"
            name="feeType"
            value={form.feeType}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {FEE_TYPES.map((feeType) => (
              <option key={feeType} value={feeType}>
                {feeType}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="fee-amount"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Amount
          </label>

          <input
            id="fee-amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="fee-discount"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Discount
          </label>

          <input
            id="fee-discount"
            name="discount"
            type="number"
            min="0"
            step="0.01"
            value={form.discount}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="fee-late-fee"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Late Fee
          </label>

          <input
            id="fee-late-fee"
            name="lateFee"
            type="number"
            min="0"
            step="0.01"
            value={form.lateFee}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="fee-payment-method"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Payment Method
          </label>

          <select
            id="fee-payment-method"
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="fee-remarks"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Remarks
          </label>

          <textarea
            id="fee-remarks"
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            maxLength={500}
            rows={3}
            placeholder="Optional remarks"
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
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
          disabled={mutation.isPending || studentsLoading}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? "Generating..." : "Generate Fee"}
        </button>
      </div>
    </form>
  );
}

export default GenerateFeeForm;
