import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ContainerRefProvider } from "@/hooks/useContainerRef";

import "@/style/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

/**
 * Scopes plugin Tailwind so it cannot leak into the host.
 * `display: contents` keeps the wrapper out of the host's layout flow.
 *
 * Wrap EVERY root this plugin renders — each extension-point component and each route.
 * The ref is the portal target for Radix components, which would otherwise escape the scope.
 */
export default function Page({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ContainerRefProvider>
        {(ref) => (
          <div
            ref={ref}
            className="care-nutrition-container"
            style={{ display: "contents" }}
          >
            {children}
          </div>
        )}
      </ContainerRefProvider>
    </QueryClientProvider>
  );
}
