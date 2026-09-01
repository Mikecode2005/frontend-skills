import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

mkdirSync("build/server", { recursive: true });

const rawConfig = readFileSync("wrangler.jsonc", "utf8");
const config = JSON.parse(rawConfig.replace(/\/\/[^\n]*/g, "").replace(/,(\s*[}\]])/g, "$1"));

const sharedEsbuildArgs = [
  "--bundle",
  "--format=esm",
  "--platform=browser",
  "--conditions=workerd,worker,browser",
  "--external:cloudflare:*",
  "--external:node:*",
  "--external:util",
  "--external:crypto",
  "--external:async_hooks",
  "--external:stream",
  "--external:buffer",
  "--external:events",
  "--outfile=build/server/worker.js",
];

if (config.main) {
  // Bundle the configured worker entry (e.g. ./workers/app.ts) so exports such as
  // Durable Object classes survive the build. The React Router server build is
  // aliased in for the virtual module the entry imports.
  execFileSync("node_modules/.bin/esbuild", [
    config.main,
    '--alias:virtual:react-router/server-build=./build/server/index.js',
    '--define:import.meta.env.MODE="production"',
    ...sharedEsbuildArgs,
  ], { stdio: "inherit" });
} else {
  const workerEntryPath = "build/server/_cf_worker_entry.js";
  const workerEntry = [
    'import { createRequestHandler } from "react-router";',
    'import * as build from "./index.js";',
    '',
    'const handler = createRequestHandler(build, "production");',
    '',
    'function shouldServeAsset(request) {',
    '  const method = request.method.toUpperCase();',
    '  if (method !== "GET" && method !== "HEAD") return false;',
    '  const pathname = new URL(request.url).pathname;',
    '  return pathname.startsWith("/assets/") || pathname.includes(".") || pathname === "/robots.txt";',
    '}',
    '',
    'export default {',
    '  async fetch(request, env, ctx) {',
    '    if (env.ASSETS && shouldServeAsset(request)) {',
    '      const assetResponse = await env.ASSETS.fetch(request);',
    '      if (assetResponse.status !== 404) return assetResponse;',
    '    }',
    '    return handler(request, { cloudflare: { env, ctx } });',
    '  },',
    '};',
  ].join("\n");
  writeFileSync(workerEntryPath, workerEntry + "\n");
  execFileSync("node_modules/.bin/esbuild", [workerEntryPath, ...sharedEsbuildArgs], { stdio: "inherit" });
  rmSync(workerEntryPath, { force: true });
}

// The platform deploy pipeline only reads metadata.bindings (a top-level vars
// key is a no-op on that path), so convert wrangler vars into env-var bindings:
// strings become plain_text bindings and everything else becomes a json binding.
// The manifest is a wrangler-valid config describing the FINAL build
// output: main names the entry module and rules declare which other files
// upload as modules (no_bundle semantics). The deploy pipeline
// (project-worker-bundle) selects modules strictly by these rules and
// lifts vars/durable_objects/kv_namespaces/r2_buckets/ai/services into API bindings.
const manifest = {
  main: "worker.js",
  no_bundle: true,
  rules: [{ type: "ESModule", globs: ["**/*.js", "**/*.mjs"] }],
  compatibility_date: config.compatibility_date,
  compatibility_flags: config.compatibility_flags ?? [],
  assets: { directory: "../client", binding: "ASSETS" },
  ...(config.vars ? { vars: config.vars } : {}),
  ...(config.durable_objects ? { durable_objects: config.durable_objects } : {}),
  ...(config.migrations ? { migrations: config.migrations } : {}),
  ...(config.kv_namespaces ? { kv_namespaces: config.kv_namespaces } : {}),
  ...(config.r2_buckets ? { r2_buckets: config.r2_buckets } : {}),
  ...(config.ai ? { ai: config.ai } : {}),
  ...(config.services ? { services: config.services } : {}),
  ...(config.bindings ? { bindings: config.bindings } : {}),
};
writeFileSync("build/server/wrangler.json", JSON.stringify(manifest, null, 2) + "\n");
console.log("build/server/wrangler.json written.");
