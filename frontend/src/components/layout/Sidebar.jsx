import {
  FiBarChart2,
  FiCalendar,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiSettings,
  FiUsers,
  FiUserCheck,
  FiX,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "react-router-dom";

import { logout } from "../../store/authSlice";

const navigation = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: FiGrid,
  },
  {
    label: "Students",
    to: "/admin/students",
    icon: FiUsers,
  },
  {
    label: "Teachers",
    to: "/admin/teachers",
    icon: FiUserCheck,
  },
  {
    label: "Parents",
    to: "/admin/parents",
    icon: FiUsers,
  },
  {
    label: "Attendance",
    to: "/admin/attendance",
    icon: FiCalendar,
  },
  {
    label: "Fees",
    to: "/admin/fees",
    icon: FiCreditCard,
  },
  {
    label: "Payments",
    to: "/admin/payments",
    icon: FiBarChart2,
  },
];

function Sidebar({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <p className="text-base font-bold text-slate-900">
              Junior Champ&apos;s
            </p>
            <p className="text-xs text-slate-500">Admin Portal</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/admin"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="mt-8">
            <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              System
            </p>

            <NavLink
              to="/admin/settings"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <FiSettings size={18} />
              <span>Settings</span>
            </NavLink>
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 rounded-xl bg-slate-50 p-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.name || "Administrator"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user?.email || "Admin account"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
