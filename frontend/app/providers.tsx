// @ts-nocheck
"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { I18nProvider } from "@react-aria/i18n";
import ReduxProvider from "@/providers/redux-provider";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { QueryClient } from "@tanstack/react-query";
import AuthProvider from "@/providers/auth-providers";
import { Toaster } from "react-hot-toast";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <I18nProvider locale="en-IN">
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>
          <ReduxProvider>
            <ReactQueryProvider>
              {/* <AuthProvider> */}
                <Toaster />
                {children}
              {/* </AuthProvider> */}
            </ReactQueryProvider>
          </ReduxProvider>
        </NextThemesProvider>
      </HeroUIProvider>
    </I18nProvider>
  );
}
