import { createBrowserRouter } from "react-router-dom";

import AdminRoute from "../components/auth/AdminRoute";
import ProtectedRoute from "../components/auth/ProtectedRoute";

import AdminLayout from "../layouts/AdminLayout";
import AuthLayout from "../layouts/AuthLayout";
import PublicLayout from "../layouts/PublicLayout";

import AddStudentPage from "../pages/admin/AddStudentPage";
import EditStudentPage from "../pages/admin/EditStudentPage"; // Yahan import kiya
import DashboardPage from "../pages/admin/DashboardPage";
import StudentsPage from "../pages/admin/StudentsPage";
import LoginPage from "../pages/auth/LoginPage";
import HomePage from "../pages/public/HomePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },

  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminRoute />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              {
                index: true,
                element: <DashboardPage />,
              },
              {
                path: "students",
                element: <StudentsPage />,
              },
              {
                path: "students/new",
                element: <AddStudentPage />,
              },
              {
                path: "students/:id/edit", // Naya Edit Student route add kiya
                element: <EditStudentPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;