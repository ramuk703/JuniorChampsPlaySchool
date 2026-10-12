import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";

import router from "./router";
import store from "../store/store";
import { clearAuth } from "../store/authSlice";
import { clearParentAuth } from "../store/parentAuthSlice";
import { clearTeacherAuth } from "../store/teacherAuthSlice";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppProviders() {
  useEffect(() => {
    const handleSessionExpired = (event) => {
      if (event.detail?.scope === "teacher") {
        store.dispatch(clearTeacherAuth());
      } else if (event.detail?.scope === "parent") {
        store.dispatch(clearParentAuth());
      } else if (event.detail?.scope === "admin") {
        store.dispatch(clearAuth());
      }
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener(
        "auth:session-expired",
        handleSessionExpired,
      );
    };
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>
  );
}

export default AppProviders;
