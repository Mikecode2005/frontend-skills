import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("agents", "routes/agents.tsx"),
  route("skills/:slug", "routes/skills.$slug.tsx"),
] satisfies RouteConfig;
