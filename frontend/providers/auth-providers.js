// @ts-nocheck
'use client'
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/slices/auth-slice";
import { useMe } from "@/libs/query/auth/use-me";

const AuthProvider = ({ children }) => {
   const dispatch = useDispatch();
   const { data: user, error, isLoading } = useMe();

   useEffect(() => {
      if (user) {
         dispatch(setUser(user));
      }
   }, [user, dispatch]);
   
   return <>{children}</>;
};

export default AuthProvider;
