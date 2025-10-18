import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   permissions: null,
};

const permissionSlice = createSlice({
    name: "permissions",
    initialState,
    reducers: {
        setPermissions(state, action) {
            state.permissions = action.payload;
        },
        resetPermissions(state) {
            state.permissions = null;
        }
    },
});

export const { 
    setPermissions, 
    resetPermissions
 } = permissionSlice.actions;
export default permissionSlice.reducer;
