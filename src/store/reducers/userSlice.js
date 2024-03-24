import { createSlice } from "@reduxjs/toolkit";

let initialState = {
  initialLoading: true,
  user: {},
};
const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    init(state, action) {
      state.initialLoading = false;
      state.user = action.payload;
    },
    logOut(state, action) {
      state.user = {};
    },
    setUser(state, action) {
      state.user = action.payload;
    },
  },
});
export const { init, logOut, setUser } = userSlice.actions;
export default userSlice.reducer;
