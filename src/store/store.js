import { configureStore, createSlice } from "@reduxjs/toolkit";

// Create a dummy slice to prevent store errors
const appSlice = createSlice({
  name: "app",
  initialState: {},
  reducers: {},
});

const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});

export default store;