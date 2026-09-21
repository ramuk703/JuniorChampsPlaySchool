import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <main className="w-full max-w-md">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthLayout;
