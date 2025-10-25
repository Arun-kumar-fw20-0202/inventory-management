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
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";

const AuthProvider = ({ children }) => {
   const dispatch = useDispatch();
   const { data: user, error, isLoading } = useMe();
   const { data: organisation, isLoading: fetchingOrganisation } = useFetchMyOrganisation({
      enabled: !!user?.data?.id
   });
   const { data: perm, isLoading: fetchingPermissions } = useFetchMyPermissions({
      enabled: !!user?.data?.id
   });

   useEffect(() => {
      if (user?.data) {
         dispatch(setUser(user));
      }
      if (organisation?.data?.organisation) {
         dispatch(setOrganisation({ organisation: organisation.data.organisation }));
      }
      if (perm?.data?.permissions) {
         dispatch(setPermissions({ permissions: perm.data.permissions }));
      }
   }, [user, organisation, perm, dispatch]);

   // Show loading state while any data is being fetched
   if (isLoading || fetchingOrganisation || fetchingPermissions) {
      return <LoadingState />;
   }

   // Handle authentication error
   if (error) {
      return <ErrorState error={error} />;
   }

   return <>{children}</>;
};

const LoadingState = () => {
   return (
      <div className="flex items-center justify-center min-h-screen">
         <div className="text-center">
            <Spinner size='lg' />
            <h2 className="text-lg font-semibold mb-2">Loading...</h2>
            <p className="text-gray-600 dark:text-gray-300">Please wait while we set up your workspace</p>
         </div>
      </div>
   );
};

const ErrorState = ({ error }) => {
   return (
      <div className="flex items-center justify-center min-h-screen">
         <div className="text-center">
            <div className="text-red-500 mb-4">
               <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
               </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4 dark:text-gray-300">
               {error?.message || "Failed to authenticate. Please try again."}
            </p>
            <Button onPress={() => window.location.reload()} color="primary">Retry</Button>
         </div>
      </div>
   );
};

export default AuthProvider;