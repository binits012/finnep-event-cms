import { createSlice } from "@reduxjs/toolkit";

let initialState = { 
  photoTypes: {},
};
const photoTypesSlice = createSlice({
  name: "phototypes",
  initialState,
  reducers: {
    init(state, action) { 
      state.photoTypes = action.payload;
    }, 
    setPhotoTypes(state, action) {
      state.photoTypes = action.payload;
    },
  },
});
export const { init, setPhotoTypes } = photoTypesSlice.actions;
export default photoTypesSlice.reducer;