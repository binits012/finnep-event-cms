import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "./reducers/userSlice";

const appReducer = combineReducers({
  auth: userReducer,
});

const rootReducer = (state, action) => {
  if (action.type === "CLEAR_STORE") {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

// export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
