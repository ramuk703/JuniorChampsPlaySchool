import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api from "../services/api";

const TOKEN_KEY = "accessToken";
const USER_KEY = "authUser";

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem(USER_KEY);

    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

const initialState = {
  accessToken: localStorage.getItem(TOKEN_KEY),
  user: getStoredUser(),
  isAuthenticated: Boolean(localStorage.getItem(TOKEN_KEY)),
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      return {
        token,
        user,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to login.",
      );
    }
  },
);

export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/profile");

      const user = response.data.user;

      localStorage.setItem(USER_KEY, JSON.stringify(user));

      return user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Unable to load profile.",
      );
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
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

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },

    clearAuth(state) {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to login.";
        state.isAuthenticated = false;
      })

      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = Boolean(state.accessToken);
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load profile.";
        state.accessToken = null;
        state.user = null;
        state.isAuthenticated = false;

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })

      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.accessToken = null;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to logout.";
        state.accessToken = null;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuthError, clearAuth } = authSlice.actions;

export default authSlice.reducer;
