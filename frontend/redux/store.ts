import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth-slice";
import organisationReducer from "./slices/organisation-slice";

export const store = configureStore({
   reducer: {
      auth: authReducer,  // Add reducers here
      organisation: organisationReducer,
   },
});

