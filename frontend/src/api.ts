import type { AppType } from "backend";
import { hc } from "hono/client";

export const api = hc<AppType>(import.meta.env.VITE_PUBLIC_API_URL);
