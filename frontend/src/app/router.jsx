import { createBrowserRouter } from "react-router-dom";

import AdminRoute from "../components/auth/AdminRoute";
import ProtectedRoute from "../components/auth/ProtectedRoute";

import AdminLayout from "../layouts/AdminLayout";
import AuthLayout from "../layouts/AuthLayout";
import PublicLayout from "../layouts/PublicLayout";

import AddStudentPage from "../pages/admin/AddStudentPage";
import AddTeacherPage from "../pages/admin/AddTeacherPage";
import AddParentPage from "../pages/admin/AddParentPage";
import EditStudentPage from "../pages/admin/EditStudentPage";
import EditTeacherPage from "../pages/admin/EditTeacherPage";
import EditParentPage from "../pages/admin/EditParentPage";
import DashboardPage from "../pages/admin/DashboardPage";
import DeletedStudentsPage from "../pages/admin/DeletedStudentsPage";
import DeletedTeachersPage from "../pages/admin/DeletedTeachersPage";
import DeletedParentsPage from "../pages/admin/DeletedParentsPage"; // Added DeletedParentsPage import
import StudentsPage from "../pages/admin/StudentsPage";
import TeachersPage from "../pages/admin/TeachersPage";
import ParentsPage from "../pages/admin/ParentsPage";
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
                path: "teachers",
                element: <TeachersPage />,
              },
              {
                path: "teachers/new",
                element: <AddTeacherPage />,
              },
              {
                path: "parents",
                element: <ParentsPage />,
              },
              {
                path: "parents/new",
                element: <AddParentPage />,
              },
              {
                path: "parents/deleted", // Added deleted parents route
                element: <DeletedParentsPage />,
              },
              {
                path: "parents/:id/edit",
                element: <EditParentPage />,
              },
              {
                path: "students/deleted",
                element: <DeletedStudentsPage />,
              },
              {
                path: "teachers/deleted",
                element: <DeletedTeachersPage />,
              },
              {
                path: "students/:id/edit",
                element: <EditStudentPage />,
              },
              {
                path: "teachers/:id/edit",
                element: <EditTeacherPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;