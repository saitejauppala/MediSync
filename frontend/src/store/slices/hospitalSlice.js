import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import hospitalService from '../../services/hospitalService';

export const fetchHospitals = createAsyncThunk('hospitals/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const data = await hospitalService.getHospitals(params);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch hospitals');
  }
});

export const fetchNearbyHospitals = createAsyncThunk('hospitals/fetchNearby', async (params, { rejectWithValue }) => {
  try {
    const data = await hospitalService.getNearbyHospitals(params);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch nearby hospitals');
  }
});

export const fetchHospitalById = createAsyncThunk('hospitals/fetchById', async (id, { rejectWithValue }) => {
  try {
    const data = await hospitalService.getHospitalById(id);
    return data.hospital;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch hospital details');
  }
});

const hospitalSlice = createSlice({
  name: 'hospitals',
  initialState: {
    items: [],
    selectedHospital: null,
    total: 0,
    totalPages: 1,
    currentPage: 1,
    loading: false,
    error: null,
    userLocation: null,
    locationPermission: 'prompt', // 'prompt' | 'granted' | 'denied'
  },
  reducers: {
    setUserLocation(state, action) {
      state.userLocation = action.payload;
    },
    setLocationPermission(state, action) {
      state.locationPermission = action.payload;
    },
    clearSelectedHospital(state) {
      state.selectedHospital = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchHospitals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHospitals.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.hospitals || [];
        state.total = action.payload.total || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
      })
      .addCase(fetchHospitals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch nearby
      .addCase(fetchNearbyHospitals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyHospitals.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.hospitals || [];
        state.total = action.payload.count || 0;
      })
      .addCase(fetchNearbyHospitals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single
      .addCase(fetchHospitalById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHospitalById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedHospital = action.payload;
      })
      .addCase(fetchHospitalById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setUserLocation, setLocationPermission, clearSelectedHospital } = hospitalSlice.actions;
export default hospitalSlice.reducer;
