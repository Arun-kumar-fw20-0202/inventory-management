import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   organisation: null,
};

const organisationSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setOrganisation: (state, action) => {
        state.organisation = action.payload;
        },
        clearOrganisation: (state) => {
        state.organisation = null;
        },  
    },
});

export const { setOrganisation, clearOrganisation } = organisationSlice.actions;
export default organisationSlice.reducer;
