import { createBrowserRouter } from "react-router-dom";

import AdminRoute from "../components/auth/AdminRoute";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import ParentRoute from "../components/auth/ParentRoute";
import TeacherRoute from "../components/auth/TeacherRoute";

import AdminLayout from "../layouts/AdminLayout";
import AuthLayout from "../layouts/AuthLayout";
import PublicLayout from "../layouts/PublicLayout";


const lazyPage = (importer) => async () => {
  const module = await importer();
  return { Component: module.default };
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        lazy: lazyPage(() => import("../pages/public/HomePage")),
      },
      {
        path: "gallery",
        lazy: lazyPage(() => import("../pages/public/GalleryPage")),
      },
      {
        path: "gallery/:id",
        lazy: lazyPage(() => import("../pages/public/GalleryDetailPage")),
      },
    ],
  },

  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        lazy: lazyPage(() => import("../pages/auth/LoginPage")),
      },
      {
        path: "forgot-password",
        lazy: lazyPage(() => import("../pages/auth/ForgotPasswordPage")),
      },
      {
        path: "reset-password",
        lazy: lazyPage(() => import("../pages/auth/ResetPasswordPage")),
      },
    ],
  },

  {
    path: "/parent/login",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        lazy: lazyPage(() => import("../pages/parent/ParentLoginPage")),
      },
    ],
  },

  {
    path: "/parent/forgot-password",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        lazy: lazyPage(() => import("../pages/parent/ParentForgotPasswordPage")),
      },
    ],
  },

  {
    path: "/parent/reset-password",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        lazy: lazyPage(() => import("../pages/parent/ParentResetPasswordPage")),
      },
    ],
  },

  {
    element: <ParentRoute />,
    children: [
      {
        path: "/parent",
        lazy: lazyPage(() => import("../pages/parent/ParentDashboardPage")),
      },
      {
        path: "/parent/child",
        lazy: lazyPage(() => import("../pages/parent/ParentChildPage")),
      },
      {
        path: "/parent/attendance",
        lazy: lazyPage(() => import("../pages/parent/ParentAttendancePage")),
      },
      {
        path: "/parent/fees",
        lazy: lazyPage(() => import("../pages/parent/ParentFeesPage")),
      },
      {
        path: "/parent/profile",
        lazy: lazyPage(() => import("../pages/parent/ParentProfilePage")),
      },
      {
        path: "/parent/password",
        lazy: lazyPage(() => import("../pages/parent/ParentPasswordPage")),
      },
    ],
  },


  {
    path: "/teacher/login",
    element: <AuthLayout />,
    children: [
      { index: true, lazy: lazyPage(() => import("../pages/teacher/TeacherLoginPage")) },
    ],
  },
  {
    element: <TeacherRoute />,
    children: [
      { path: "/teacher", lazy: lazyPage(() => import("../pages/teacher/TeacherDashboardPage")) },
      { path: "/teacher/profile", lazy: lazyPage(() => import("../pages/teacher/TeacherProfilePage")) },
      { path: "/teacher/attendance", lazy: lazyPage(() => import("../pages/teacher/TeacherAttendancePage")) },
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
                lazy: lazyPage(() => import("../pages/admin/DashboardPage")),
              },
              {
                path: "students",
                lazy: lazyPage(() => import("../pages/admin/StudentsPage")),
              },
              {
                path: "students/new",
                lazy: lazyPage(() => import("../pages/admin/AddStudentPage")),
              },
              {
                path: "teachers",
                lazy: lazyPage(() => import("../pages/admin/TeachersPage")),
              },
              {
                path: "teachers/new",
                lazy: lazyPage(() => import("../pages/admin/AddTeacherPage")),
              },
              {
                path: "parents",
                lazy: lazyPage(() => import("../pages/admin/ParentsPage")),
              },
              {
                path: "attendance",
                lazy: lazyPage(() => import("../pages/admin/AttendancePage")),
              },
              {
                path: "fees",
                lazy: lazyPage(() => import("../pages/admin/FeesPage")),
              },
              {
                path: "fee-structures",
                lazy: lazyPage(() => import("../pages/admin/FeeStructuresPage")),
              },
              {
                path: "gallery",
                lazy: lazyPage(() => import("../pages/admin/GalleryPage")),
              },
              {
                path: "teacher-attendance",
                lazy: lazyPage(() => import("../pages/admin/TeacherAttendancePage")),
              },
              {
                path: "parents/new",
                lazy: lazyPage(() => import("../pages/admin/AddParentPage")),
              },
              {
                path: "parents/deleted", // Added deleted parents route
                lazy: lazyPage(() => import("../pages/admin/DeletedParentsPage")),
              },
              {
                path: "parents/:id/edit",
                lazy: lazyPage(() => import("../pages/admin/EditParentPage")),
              },
              {
                path: "students/deleted",
                lazy: lazyPage(() => import("../pages/admin/DeletedStudentsPage")),
              },
              {
                path: "teachers/deleted",
                lazy: lazyPage(() => import("../pages/admin/DeletedTeachersPage")),
              },
              {
                path: "students/:id/edit",
                lazy: lazyPage(() => import("../pages/admin/EditStudentPage")),
              },
              {
                path: "teachers/:id/edit",
                lazy: lazyPage(() => import("../pages/admin/EditTeacherPage")),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    lazy: lazyPage(() => import("../pages/public/NotFoundPage")),
  },
]);

export default router;
