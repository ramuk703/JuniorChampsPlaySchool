import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdmissionEnquiries, updateAdmissionEnquiry } from "../../services/admissionService";

const statuses = ["New", "Contacted", "Visit Scheduled", "Admitted", "Closed"];
const inputClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

export default function AdmissionsPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const queryClient = useQueryClient();

  const enquiriesQuery = useQuery({
    queryKey: ["admission-enquiries", { status, search, page }],
    queryFn: () => getAdmissionEnquiries({ status: status || undefined, search: search || undefined, page, limit: 10 }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdmissionEnquiry(id, payload),

onSuccess: async () => {
  setSelected(null);
  setAdminNotes("");
  await queryClient.invalidateQueries({
    queryKey: ["admission-enquiries"],
  });
},

  });

  const enquiries = enquiriesQuery.data?.data || [];
  const pagination = enquiriesQuery.data?.pagination;
  const openRecord = (item) => { setSelected(item); setAdminNotes(item.adminNotes || ""); };
  const update = (payload) => selected && updateMutation.mutate({ id: selected._id, payload });

  return (
    <main className="space-y-6 p-4 text-slate-900 dark:text-slate-100 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admission enquiries</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Review public enquiries and track their progress. These records are separate from student registrations.</p>
      </header>

      <section className="flex flex-col gap-3 sm:flex-row">
        <input className={`${inputClass} min-w-0 flex-1`} aria-label="Search enquiries" placeholder="Search child, guardian, mobile, email…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
        <select className={inputClass} aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}
        </select>
      </section>

      {enquiriesQuery.isLoading && <p className="text-slate-600 dark:text-slate-300">Loading enquiries…</p>}
      {enquiriesQuery.isError && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-200">{enquiriesQuery.error?.response?.data?.message || "Could not load enquiries."}</p>}
      {!enquiriesQuery.isLoading && !enquiriesQuery.isError && enquiries.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">No admission enquiries found.</p>}

      {enquiries.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300"><tr>
              <th className="px-4 py-3">Child / class</th><th className="px-4 py-3">Parent / guardian</th><th className="px-4 py-3">Mobile</th><th className="px-4 py-3">Received</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {enquiries.map((item) => <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                <td className="px-4 py-3"><div className="font-semibold text-slate-900 dark:text-white">{item.childName}</div><div className="text-slate-500 dark:text-slate-400">{item.requestedClass}</div></td>
                <td className="px-4 py-3">{item.guardianName}</td><td className="px-4 py-3">{item.mobile}</td>
                <td className="px-4 py-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{item.status}</span></td>
                <td className="px-4 py-3"><button className="font-semibold text-indigo-700 hover:underline dark:text-indigo-400" onClick={() => openRecord(item)}>Review</button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-300">Page {pagination.page} of {pagination.totalPages} · {pagination.total} enquiries</span>
        <div className="flex gap-2"><button className={inputClass} disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button className={inputClass} disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>
      </div>}

      {selected && <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Review: {selected.childName}</h2><p className="text-sm text-slate-500 dark:text-slate-400">{selected.guardianName} · {selected.mobile}{selected.email ? ` · ${selected.email}` : ""}</p></div><button className={inputClass} onClick={() => setSelected(null)}>Close</button></div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500 dark:text-slate-400">Date of birth</dt><dd className="font-medium text-slate-800 dark:text-slate-100">{new Date(selected.dateOfBirth).toLocaleDateString()}</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">Requested class</dt><dd className="font-medium text-slate-800 dark:text-slate-100">{selected.requestedClass}</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">Relationship</dt><dd className="font-medium text-slate-800 dark:text-slate-100">{selected.relationship}</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">Address</dt><dd className="font-medium text-slate-800 dark:text-slate-100">{selected.address || "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-slate-500 dark:text-slate-400">Message</dt><dd className="whitespace-pre-wrap font-medium">{selected.message || "—"}</dd></div>
        </dl>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">Status
            <select className={inputClass} value={selected.status} onChange={(event) =>
  setSelected((current) => ({
    ...current,
    status: event.target.value,
  }))
}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">Admin notes
            <textarea className={`${inputClass} min-h-24`} maxLength={3000} value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} />
          </label>
          <div className="sm:col-span-2"><button disabled={updateMutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60" onClick={() => update({ adminNotes })}>{updateMutation.isPending ? "Saving…" : "Save notes"}</button>
            {updateMutation.isError && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{updateMutation.error?.response?.data?.message || "Could not update enquiry."}</p>}
            {updateMutation.isSuccess && <p role="status" className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">Changes saved.</p>}
          </div>
        </div>
      </div>}
    </main>
  );
}
