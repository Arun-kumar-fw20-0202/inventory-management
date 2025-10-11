// @ts-nocheck
'use client'
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/slices/auth-slice";
import { useMe } from "@/libs/query/auth/use-me";
import { useFetchMyOrganisation } from "@/libs/mutation/organisation/organisation-mutation";
import { setOrganisation } from "@/redux/slices/organisation-slice";

const AuthProvider = ({ children }) => {
   const dispatch = useDispatch();
   const { data: user, error, isLoading } = useMe();
   const { data: organisation, isLoading: fetchingOrganisation } = useFetchMyOrganisation();


   useEffect(() => {
      if (user) {
         dispatch(setUser(user));
      }
      if(organisation?.data?.organisation){
         dispatch(setOrganisation({ organisation: organisation?.data?.organisation }));
      }
   }, [user, dispatch, organisation]);
   
   return <>{children}</>;
};

export default AuthProvider;
