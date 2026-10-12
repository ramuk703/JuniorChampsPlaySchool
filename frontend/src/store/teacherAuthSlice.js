import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginTeacher as loginApi, getTeacherMe } from "../services/teacherAuthService";

const TOKEN = "teacherAccessToken";
const USER = "teacherUser";
const PROFILE = "teacherProfile";
const readJson = (key) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : null; }
  catch { localStorage.removeItem(key); return null; }
};

const initialState = {
  accessToken: localStorage.getItem(TOKEN),
  user: readJson(USER),
  teacher: readJson(PROFILE),
  isAuthenticated: Boolean(localStorage.getItem(TOKEN)),
  loading: false,
  error: null,
};

export const loginTeacher = createAsyncThunk("teacherAuth/login", async (credentials, { rejectWithValue }) => {
  try {
    const result = await loginApi(credentials);
    localStorage.setItem(TOKEN, result.token);
    localStorage.setItem(USER, JSON.stringify(result.user));
    localStorage.setItem(PROFILE, JSON.stringify(result.teacher));
    return result;
  } catch (error) { return rejectWithValue(error.response?.data?.message || "Unable to sign in."); }
});

export const fetchTeacherMe = createAsyncThunk("teacherAuth/me", async (_, { rejectWithValue }) => {
  try {
    const result = await getTeacherMe();
    localStorage.setItem(USER, JSON.stringify(result.user));
    localStorage.setItem(PROFILE, JSON.stringify(result.teacher));
    return result;
  } catch (error) { return rejectWithValue(error.response?.data?.message || "Unable to load profile."); }
});

const clearStorage = () => {
  localStorage.removeItem(TOKEN); localStorage.removeItem(USER); localStorage.removeItem(PROFILE);
};
const slice = createSlice({
  name: "teacherAuth",
  initialState,
  reducers: {
    clearTeacherAuth(state) {
      state.accessToken = null; state.user = null; state.teacher = null;
      state.isAuthenticated = false; state.loading = false; state.error = null;
      clearStorage();
    },
  },
  extraReducers: (builder) => builder
    .addCase(loginTeacher.pending, (state) => { state.loading = true; state.error = null; })
    .addCase(loginTeacher.fulfilled, (state, action) => {
      state.loading = false; state.accessToken = action.payload.token;
      state.user = action.payload.user; state.teacher = action.payload.teacher; state.isAuthenticated = true;
    })
    .addCase(loginTeacher.rejected, (state, action) => {
      state.loading = false; state.error = action.payload || "Unable to sign in."; state.isAuthenticated = false;
    })
    .addCase(fetchTeacherMe.fulfilled, (state, action) => { state.user = action.payload.user; state.teacher = action.payload.teacher; })
    .addCase(fetchTeacherMe.rejected, (state, action) => { state.error = action.payload || "Unable to load profile."; })
});
export const { clearTeacherAuth } = slice.actions;
export default slice.reducer;
