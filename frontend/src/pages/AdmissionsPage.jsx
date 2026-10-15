import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { submitAdmissionEnquiry } from "../services/admissionService";

const initialForm = {
  childName: "", dateOfBirth: "", requestedClass: "", guardianName: "",
  relationship: "Father", mobile: "", email: "", address: "", message: "",
};

const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900";

export default function AdmissionsPage() {
  const [form, setForm] = useState(initialForm);
  const mutation = useMutation({
    mutationFn: submitAdmissionEnquiry,
    onSuccess: () => setForm(initialForm),
  });

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    mutation.mutate(form);
  };
  const serverMessage = mutation.error?.response?.data?.message;
  const errors = mutation.error?.response?.data?.errors;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-slate-900 dark:text-slate-100 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Admissions</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Enquire about admission</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">Share your details and our school team will contact you about the next steps.</p>
      </div>

      {mutation.isSuccess && (
        <div role="status" className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          {mutation.data?.message || "Your enquiry has been submitted successfully."}
        </div>
      )}
      {mutation.isError && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {serverMessage || "We could not submit your enquiry. Please check your connection and try again."}
          {Array.isArray(errors) && <ul className="mt-2 list-disc pl-5">{errors.map((error, index) => <li key={`${error.field}-${index}`}>{error.field}: {error.message}</li>)}</ul>}
        </div>
      )}

      <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 sm:p-8">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">Child's full name *
          <input className={fieldClass} name="childName" value={form.childName} onChange={change} minLength={2} maxLength={100} required />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">Date of birth *
          <input className={fieldClass} type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={change} max={new Date().toISOString().slice(0, 10)} required />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">Class interested in *
          <input className={fieldClass} name="requestedClass" value={form.requestedClass} onChange={change} maxLength={80} placeholder="e.g. Nursery, LKG, UKG" required />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">Parent / guardian name *
          <input className={fieldClass} name="guardianName" value={form.guardianName} onChange={change} minLength={2} maxLength={100} required />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">Relationship *
          <select className={fieldClass} name="relationship" value={form.relationship} onChange={change} required>
            {["Father", "Mother", "Guardian", "Other"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">Mobile number *
          <input className={fieldClass} type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" name="mobile" value={form.mobile} onChange={change} maxLength={10} placeholder="10-digit Indian mobile number" required />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">Email (optional)
          <input className={fieldClass} type="email" name="email" value={form.email} onChange={change} maxLength={254} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">Address (optional)
          <textarea className={fieldClass} name="address" value={form.address} onChange={change} rows={2} maxLength={500} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">Message (optional)
          <textarea className={fieldClass} name="message" value={form.message} onChange={change} rows={3} maxLength={2000} placeholder="Anything you'd like our team to know?" />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={mutation.isPending} className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {mutation.isPending ? "Submitting…" : "Submit enquiry"}
          </button>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Fields marked * are required. Please submit one enquiry per child.</p>
        </div>
      </form>
    </main>
  );
}
