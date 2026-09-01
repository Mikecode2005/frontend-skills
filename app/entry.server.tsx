import { renderToReadableStream } from "react-dom/server.edge";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";

// React Router's idiomatic hook for server-side error logging. It catches
// loader, action, and rendering errors before the ErrorBoundary renders,
// so they reach console.error and flow through the worker log tail pipeline
// instead of being silently swallowed by the ErrorBoundary.
export function handleError(error: unknown) {
  console.error(error);
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
): Promise<Response> {
  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );
  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, { headers: responseHeaders, status: responseStatusCode });
}
