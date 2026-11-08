import { createSlice } from '@reduxjs/toolkit';

const storedCompare = localStorage.getItem('medisync_compare');

const compareSlice = createSlice({
  name: 'compare',
  initialState: {
    hospitals: storedCompare ? JSON.parse(storedCompare) : [],
  },
  reducers: {
    addToCompare(state, action) {
      if (state.hospitals.some((h) => h._id === action.payload._id)) {
        return;
      }
      if (state.hospitals.length < 3) {
        state.hospitals.push(action.payload);
        localStorage.setItem('medisync_compare', JSON.stringify(state.hospitals));
      }
    },
    removeFromCompare(state, action) {
      state.hospitals = state.hospitals.filter((h) => h._id !== action.payload);
      localStorage.setItem('medisync_compare', JSON.stringify(state.hospitals));
    },
    clearCompare(state) {
      state.hospitals = [];
      localStorage.removeItem('medisync_compare');
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;
