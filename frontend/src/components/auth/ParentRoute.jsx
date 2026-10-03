import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function ParentRoute() {
  const location = useLocation();
  const { isAuthenticated } = useSelector(
    (state) => state.parentAuth,
  );

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/parent/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}

export default ParentRoute;
