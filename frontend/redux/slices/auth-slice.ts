import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   user: null,            // Store user data
   isAuthenticated: false, // Track if the user is authenticated
};

const authSlice = createSlice({
   name: "auth",
   initialState,
   reducers: {
      setUser: (state, action) => {
         state.user = action.payload;
         state.isAuthenticated = true;
      },
      clearUser: (state) => {
         state.user = null;
         state.isAuthenticated = false;
      },
   },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
