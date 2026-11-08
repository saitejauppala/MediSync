import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

const storedUser = localStorage.getItem('medisync_user');
const storedToken = localStorage.getItem('medisync_token');

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await authService.login(credentials);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const data = await authService.register(userData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const data = await authService.getMe();
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
  }
});

export const toggleSaveHospital = createAsyncThunk('auth/toggleSaveHospital', async (hospitalId, { rejectWithValue }) => {
  try {
    const data = await authService.toggleSaveHospital(hospitalId);
    return { hospitalId, savedHospitals: data.savedHospitals, saved: data.saved };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to toggle favorite');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    isAuthenticated: !!storedToken,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('medisync_token');
      localStorage.removeItem('medisync_user');
      authService.logout();
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('medisync_token', action.payload.token);
        localStorage.setItem('medisync_user', JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('medisync_token', action.payload.token);
        localStorage.setItem('medisync_user', JSON.stringify(action.payload.user));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get me
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('medisync_user', JSON.stringify(action.payload));
      })
      // Save hospital
      .addCase(toggleSaveHospital.fulfilled, (state, action) => {
        if (state.user) {
          state.user.savedHospitals = action.payload.savedHospitals;
          localStorage.setItem('medisync_user', JSON.stringify(state.user));
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

