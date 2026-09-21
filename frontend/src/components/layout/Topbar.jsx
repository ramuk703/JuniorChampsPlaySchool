import {
  FiBell,
  FiChevronDown,
  FiMenu,
  FiSearch,
} from "react-icons/fi";
import { useSelector } from "react-redux";

function Topbar({ onMenuClick }) {
  const user = useSelector((state) => state.auth.user);

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AD";

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open sidebar"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <FiMenu size={22} />
          </button>

          <div className="relative hidden w-72 md:block lg:w-80">
            <FiSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              placeholder="Search..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div className="md:hidden">
            <p className="text-sm font-bold text-slate-900">
              Junior Champ&apos;s
            </p>
            <p className="text-[11px] text-slate-500">Admin Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100"
          >
            <FiBell size={20} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <div className="hidden h-7 w-px bg-slate-200 sm:block" />

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {initials}
            </span>

            <span className="hidden max-w-32 text-left sm:block">
              <span className="block truncate text-sm font-semibold text-slate-900">
                {user?.name || "Administrator"}
              </span>

              <span className="block text-xs capitalize text-slate-500">
                {user?.role || "admin"}
              </span>
            </span>

            <FiChevronDown className="hidden text-slate-400 sm:block" size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
