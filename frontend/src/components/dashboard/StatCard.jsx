import { FiArrowUpRight } from "react-icons/fi";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading = false,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          {loading ? (
            <div className="mt-3 h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
          ) : (
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={21} />
        </div>
      </div>

      {description ? (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          <FiArrowUpRight size={14} />
          <span>{description}</span>
        </div>
      ) : null}
    </article>
  );
}

export default StatCard;
