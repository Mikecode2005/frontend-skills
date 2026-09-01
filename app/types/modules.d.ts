// Ambient module declarations for the scaffold's import conventions.

// Deep per-icon lucide imports keep the build graph small; lucide-react
// ships no per-icon type declarations, so type them here.
declare module "lucide-react/dist/esm/icons/*" {
  import type { LucideIcon } from "lucide-react";
  const Icon: LucideIcon;
  export default Icon;
}

// Virtual module provided by the React Router build (imported by workers/app.ts).
declare module "virtual:react-router/server-build" {
  import type { ServerBuild } from "react-router";
  const build: ServerBuild;
  export = build;
}
