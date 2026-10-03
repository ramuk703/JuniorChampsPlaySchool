import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiSave,
} from "react-icons/fi";

import { createFeeStructure } from "../../services/feeStructureService";

const initialForm = {
  className: "",
  admissionFee: "1000",
  monthlyFee: "600",
  transportFee: "400",
  annualFee: "0",
  examFee: "0",
};

function FeeStructureForm({ onSuccess }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);

  const mutation = useMutation({
    mutationFn: createFeeStructure,
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ["fee-structures"],
      });

      setForm(initialForm);

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

    if (!form.className.trim()) {
      return;
    }

    mutation.mutate({
      className: form.className.trim(),
      admissionFee: Number(form.admissionFee),
      monthlyFee: Number(form.monthlyFee),
      transportFee: Number(form.transportFee),
      annualFee: Number(form.annualFee),
      examFee: Number(form.examFee),
    });
  };

  const errorMessage =
    mutation.error?.response?.data?.message ||
    mutation.error?.message ||
    "";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-800">
          Create Fee Structure
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Define the fee amounts for a class.
        </p>
      </div>

      {mutation.isSuccess ? (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Fee structure created successfully.</span>
        </div>
      ) : null}

      {mutation.isError ? (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage || "Unable to create fee structure."}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label
              htmlFor="className"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Class Name
            </label>

            <input
              id="className"
              name="className"
              type="text"
              value={form.className}
              onChange={handleChange}
              placeholder="e.g. Nursery"
              maxLength={50}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="admissionFee"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Admission Fee
            </label>

            <input
              id="admissionFee"
              name="admissionFee"
              type="number"
              min="0"
              step="0.01"
              value={form.admissionFee}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="monthlyFee"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Monthly Fee
            </label>

            <input
              id="monthlyFee"
              name="monthlyFee"
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyFee}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="transportFee"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Transport Fee
            </label>

            <input
              id="transportFee"
              name="transportFee"
              type="number"
              min="0"
              step="0.01"
              value={form.transportFee}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="annualFee"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Annual Fee
            </label>

            <input
              id="annualFee"
              name="annualFee"
              type="number"
              min="0"
              step="0.01"
              value={form.annualFee}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="examFee"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Exam Fee
            </label>

            <input
              id="examFee"
              name="examFee"
              type="number"
              min="0"
              step="0.01"
              value={form.examFee}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSave className="h-4 w-4" />
            {mutation.isPending ? "Saving..." : "Create Fee Structure"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FeeStructureForm;
