import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
export default function TeacherRoute() {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.teacherAuth);
  if (!isAuthenticated || user?.role !== "teacher") return <Navigate to="/teacher/login" replace state={{ from: location }} />;
  return <Outlet />;
}
