import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Page not found
        </p>

        <h1 className="mt-3 text-7xl font-bold tracking-tight text-slate-900">
          404
        </h1>

        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
          The page you are looking for does not exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Go to Home
          </Link>

          <Link
            to="/auth/login"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default NotFoundPage;
