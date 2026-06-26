"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { AUTH_LOGOUT_EVENT } from "@/stores/auth-store";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  );

  useEffect(() => {
    const clearCachedUserData = () => queryClient.clear();

    window.addEventListener(AUTH_LOGOUT_EVENT, clearCachedUserData);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, clearCachedUserData);
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
