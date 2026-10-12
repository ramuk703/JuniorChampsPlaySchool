import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import parentAuthReducer from "./parentAuthSlice";
import teacherAuthReducer from "./teacherAuthSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    parentAuth: parentAuthReducer,
    teacherAuth: teacherAuthReducer,
  },
});

export default store;
