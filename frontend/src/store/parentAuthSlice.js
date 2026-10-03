import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getParentDashboard,
  loginParent as loginParentApi,
  logoutParent as logoutParentApi,
} from "../services/parentAuthService";

const TOKEN_KEY = "parentAccessToken";
const USER_KEY = "parentUser";

const getStoredParent = () => {
  try {
    const storedParent = localStorage.getItem(USER_KEY);

    return storedParent ? JSON.parse(storedParent) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

const initialState = {
  accessToken: localStorage.getItem(TOKEN_KEY),
  parent: getStoredParent(),
  dashboard: null,
  isAuthenticated: Boolean(localStorage.getItem(TOKEN_KEY)),
  loading: false,
  dashboardLoading: false,
  error: null,
};

export const loginParent = createAsyncThunk(
  "parentAuth/loginParent",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await loginParentApi({ email, password });

      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.parent));

      return {
        token: response.token,
        parent: response.parent,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to login.",
      );
    }
  },
);

export const fetchParentDashboard = createAsyncThunk(
  "parentAuth/fetchParentDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getParentDashboard();

      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to load dashboard.",
      );
    }
  },
);

export const logoutParent = createAsyncThunk(
  "parentAuth/logoutParent",
  async (_, { rejectWithValue }) => {
    try {
      await logoutParentApi();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to logout.",
      );
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }

    return true;
  },
);

const parentAuthSlice = createSlice({
  name: "parentAuth",
  initialState,
  reducers: {
    clearParentAuthError(state) {
      state.error = null;
    },

    clearParentAuth(state) {
      state.accessToken = null;
      state.parent = null;
      state.dashboard = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.dashboardLoading = false;
      state.error = null;

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginParent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginParent.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.token;
        state.parent = action.payload.parent;
        state.isAuthenticated = true;
      })
      .addCase(loginParent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to login.";
        state.isAuthenticated = false;
      })

      .addCase(fetchParentDashboard.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchParentDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboard = action.payload;
        state.parent = action.payload.parent;
      })
      .addCase(fetchParentDashboard.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error =
          action.payload || "Unable to load dashboard.";
      })

      .addCase(logoutParent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutParent.fulfilled, (state) => {
        state.loading = false;
        state.accessToken = null;
        state.parent = null;
        state.dashboard = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutParent.rejected, (state, action) => {
        state.loading = false;
        state.accessToken = null;
        state.parent = null;
        state.dashboard = null;
        state.isAuthenticated = false;
        state.error = action.payload || "Unable to logout.";
      });
  },
});

export const {
  clearParentAuthError,
  clearParentAuth,
} = parentAuthSlice.actions;

export default parentAuthSlice.reducer;
