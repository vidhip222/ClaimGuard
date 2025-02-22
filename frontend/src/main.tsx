import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { rootRoute } from "./routes/root";
import { homeRoute } from "./routes/home";
import { uploadRoute } from "./routes/upload";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const routeTree = rootRoute.addChildren([homeRoute, uploadRoute]);
const router = createRouter({ routeTree });
const queryClient = new QueryClient();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
