type ConnectionMethodCatalogEntry = {
  alias: string;
  connection: {
    id: string;
    type: string;
    name: string;
    displayName: string;
  };
  methods: Array<{
    name: string;
    tool: string;
    description?: string;
    example?: string;
    inputSchema?: unknown;
    outputSchema?: unknown;
  }>;
  error?: {
    message: string;
    code?: unknown;
    data?: unknown;
  };
};

type ConnectionFindQuery =
  | string
  | {
      id?: string;
      alias?: string;
      type?: string;
      name?: string;
    };

export type ConnectionsBinding = {
  list(): Promise<unknown[]>;
  get(connection: string): Promise<unknown>;
  tools(connection: string): Promise<unknown[]>;
  methods(): Promise<ConnectionMethodCatalogEntry[]>;
  find(query: ConnectionFindQuery): Promise<ConnectionMethodCatalogEntry>;
  test(query: ConnectionFindQuery): Promise<unknown>;
};

type ConnectionInvokeRequest = {
  connection: string;
  method?: string;
  input?: unknown;
};

type ConnectionMethodInvoker = ConnectionsBinding & {
  invoke<T = unknown>(request: ConnectionInvokeRequest): Promise<T>;
  [legacyInvokeMethod: string]: unknown;
};

type ConnectionsEnv = {
  CONNECTIONS: ConnectionsBinding;
};

type ConnectionMethod = {
  <T = unknown>(input?: Record<string, unknown>): Promise<T>;
  (input: string | URL | Request, init?: RequestInit): Promise<Response>;
};
type ConnectionProxy = Record<string, ConnectionMethod>;
type ConnectionsProxy = Record<string, ConnectionProxy> & {
  $methods(): Promise<ConnectionMethodCatalogEntry[]>;
  $find(query: ConnectionFindQuery): Promise<ConnectionMethodCatalogEntry>;
  $test(query: ConnectionFindQuery): Promise<unknown>;
  $list(): Promise<unknown[]>;
  $get(connection: string): Promise<unknown>;
  $tools(connection: string): Promise<unknown[]>;
};

export function createConnections(env: ConnectionsEnv): ConnectionsProxy {
  const binding = env.CONNECTIONS;
  const legacyInvokeMethod = ["_", "_", "invoke"].join("");
  const invokeConnectionMethod = <T = unknown>(request: ConnectionInvokeRequest): Promise<T> => {
    const invoker = binding as ConnectionMethodInvoker;
    if (typeof invoker.invoke === "function") {
      return invoker.invoke(request) as Promise<T>;
    }
    if (typeof invoker[legacyInvokeMethod] === "function") {
      return invoker[legacyInvokeMethod](request) as Promise<T>;
    }
    throw new Error("CONNECTIONS method invocation is not configured");
  };
  const responseFromFetchPayload = (payload: unknown): unknown => {
    if (!payload || typeof payload !== "object" || typeof (payload as { status?: unknown }).status !== "number") {
      return payload;
    }
    const record = payload as {
      status: number;
      statusText?: string;
      headers?: Record<string, string>;
      bodyText?: string;
      truncated?: boolean;
    };
    const headers = new Headers(record.headers ?? {});
    if (record.truncated) headers.set("x-camelai-truncated", "true");
    return new Response(record.bodyText ?? "", {
      status: record.status,
      statusText: record.statusText ?? "",
      headers,
    });
  };
  const serializeFetchInput = async (
    input: string | URL | Request,
  ): Promise<{ input: string; init: Record<string, unknown> }> => {
    if (input instanceof Request) {
      return {
        input: input.url,
        init: {
          method: input.method,
          headers: Object.fromEntries(input.headers.entries()),
          body: input.method === "GET" || input.method === "HEAD" ? undefined : await input.text(),
        },
      };
    }
    return { input: String(input), init: {} };
  };
  const serializeFetchInit = (init: unknown): Record<string, unknown> => {
    if (!init || typeof init !== "object") return {};
    const output = { ...(init as Record<string, unknown>) };
    const headers = (init as RequestInit).headers;
    if (headers) {
      output.headers = Object.fromEntries(new Headers(headers).entries());
    }
    return output;
  };

  return new Proxy({} as ConnectionsProxy, {
    get(_target, connectionName) {
      if (connectionName === "then") return undefined;
      if (connectionName === "$methods") return () => binding.methods();
      if (connectionName === "$find") return (query: ConnectionFindQuery) => binding.find(query);
      if (connectionName === "$test") return (query: ConnectionFindQuery) => binding.test(query);
      if (connectionName === "$list") return () => binding.list();
      if (connectionName === "$get") return (connection: string) => binding.get(connection);
      if (connectionName === "$tools") return (connection: string) => binding.tools(connection);
      if (typeof connectionName !== "string") return undefined;

      return new Proxy({} as ConnectionProxy, {
        get(_connectionTarget, methodName) {
          if (methodName === "then") return undefined;
          if (typeof methodName !== "string") return undefined;
          return (async (...args: unknown[]) => {
            let input: unknown = args[0] ?? {};
            if (methodName === "fetch") {
              const serialized = await serializeFetchInput(
                (args[0] ?? "") as string | URL | Request,
              );
              input = {
                ...serialized,
                init: {
                  ...serialized.init,
                  ...serializeFetchInit(args[1]),
                },
              };
            }
            const result = await invokeConnectionMethod({
              connection: connectionName,
              method: methodName,
              input,
            });
            return methodName === "fetch" ? responseFromFetchPayload(result) : result;
          }) as ConnectionMethod;
        },
      });
    },
  });
}
