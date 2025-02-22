import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";

export const homeRoute = createRoute({
  path: "/",
  getParentRoute: () => rootRoute,
  component: Home,
});

function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Hello World</h1>
    </div>
  );
}
