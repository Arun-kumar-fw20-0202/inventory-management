// @ts-nocheck
'use client'
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/slices/auth-slice";
import { useMe } from "@/libs/query/auth/use-me";
import { useFetchMyOrganisation } from "@/libs/mutation/organisation/organisation-mutation";
import { setOrganisation } from "@/redux/slices/organisation-slice";
import { useFetchMyPermissions } from "@/libs/mutation/permission/permission-mutations";
import { setPermissions } from "@/redux/slices/permission-slice";

const AuthProvider = ({ children }) => {
   const dispatch = useDispatch();
   const { data: user, error, isLoading } = useMe();
   const { data: organisation, isLoading: fetchingOrganisation } = useFetchMyOrganisation();
   const { data: perm, isLoading: fetchingPermissions } = useFetchMyPermissions({
      enabled: !!user?.data?.id
   });

   console.log('organisation in auth provider', perm?.data);

   // console.log('perm in auth provider', user);

   useEffect(() => {
      if (user) {
         dispatch(setUser(user));
      }
      if(organisation?.data?.organisation){
         dispatch(setOrganisation({ organisation: organisation?.data?.organisation }));
      }
      if(perm){
         dispatch(setPermissions({ permissions: perm?.data?.permissions }))
      }
   }, [user, dispatch, organisation , perm]);
   
   return <>{children}</>;
};

export default AuthProvider;
