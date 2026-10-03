import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import parentAuthReducer from "./parentAuthSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    parentAuth: parentAuthReducer,
  },
});

export default store;
