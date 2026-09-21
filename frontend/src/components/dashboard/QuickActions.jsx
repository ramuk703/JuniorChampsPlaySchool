import {
  FiCalendar,
  FiCreditCard,
  FiPlus,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const actions = [
  {
    label: "Add Student",
    description: "Register a new student",
    to: "/admin/students/new",
    icon: FiUsers,
  },
  {
    label: "Add Teacher",
    description: "Create teacher profile",
    to: "/admin/teachers/new",
    icon: FiUserCheck,
  },
  {
    label: "Attendance",
    description: "Manage attendance",
    to: "/admin/attendance",
    icon: FiCalendar,
  },
  {
    label: "Fees",
    description: "Manage student fees",
    to: "/admin/fees",
    icon: FiCreditCard,
  },
];

function QuickActions() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="font-semibold text-slate-900">
          Quick Actions
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Common administrative tasks
        </p>
      </div>

      <div className="mt-5 space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                <Icon size={18} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">
                  {action.label}
                </span>

                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {action.description}
                </span>
              </span>

              <FiPlus
                size={16}
                className="text-slate-300 transition group-hover:text-slate-600"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default QuickActions;
