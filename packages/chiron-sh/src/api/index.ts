import {
  APIError,
  type CookieOptions,
  type CookiePrefixOptions,
  type Endpoint,
  createRouter,
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
} from "better-call";
import type { ChironContext } from "../init";
import type { ChironOptions } from "../types";
import type { UnionToIntersection } from "../types/helper";
import { ok } from "./routes/ok";
import { logger } from "../utils/logger";
import type { ChironPlugin } from "../plugins";
import { onRequestRateLimit } from "./rate-limiter";

export function getEndpoints<
  C extends ChironContext,
  Option extends ChironOptions,
>(ctx: Promise<C> | C, options: Option) {
  const pluginEndpoints = options.plugins?.reduce(
    (acc, plugin) => {
      return {
        ...acc,
        ...plugin.endpoints,
      };
    },
    {} as Record<string, any>
  );

  type PluginEndpoint = UnionToIntersection<
    Option["plugins"] extends Array<infer T>
      ? T extends ChironPlugin
        ? T extends {
            endpoints: infer E;
          }
          ? E
          : {}
        : {}
      : {}
  >;

  const middlewares =
    options.plugins
      ?.map((plugin) =>
        plugin.middlewares?.map((m) => {
          const middleware = (async (context: any) => {
            return m.middleware({
              ...context,
              context: {
                ...ctx,
                ...context.context,
              },
            });
          }) as Endpoint;
          middleware.path = m.path;
          middleware.options = m.middleware.options;
          middleware.headers = m.middleware.headers;
          return {
            path: m.path,
            middleware,
          };
        })
      )
      .filter((plugin) => plugin !== undefined)
      .flat() || [];

  const baseEndpoints = {};
  const endpoints = {
    ...baseEndpoints,
    ...pluginEndpoints,
    ok,
  };
  let api: Record<string, any> = {};
  for (const [key, endpoint] of Object.entries(endpoints)) {
    api[key] = async (context = {} as any) => {
      endpoint.headers = new Headers();
      let internalCtx = {
        setHeader(key: string, value: string) {
          endpoint.headers.set(key, value);
        },
        setCookie(key: string, value: string, options?: CookieOptions) {
          setCookie(endpoint.headers, key, value, options);
        },
        getCookie(key: string, prefix?: CookiePrefixOptions) {
          const header = context.headers;
          const cookieH = header?.get("cookie");
          const cookie = getCookie(cookieH || "", key, prefix);
          return cookie;
        },
        getSignedCookie(
          key: string,
          secret: string,
          prefix?: CookiePrefixOptions
        ) {
          const header = context.headers;
          if (!header) {
            return null;
          }
          const cookie = getSignedCookie(header, secret, key, prefix);
          return cookie;
        },
        async setSignedCookie(
          key: string,
          value: string,
          secret: string | BufferSource,
          options?: CookieOptions
        ) {
          await setSignedCookie(endpoint.headers, key, value, secret, options);
        },
        redirect(url: string) {
          endpoint.headers.set("Location", url);
          return new APIError("FOUND");
        },
        responseHeader: endpoint.headers,
      };

      let authCtx = await ctx;

      let newSession = null;
      let internalContext = {
        ...internalCtx,
        ...context,
        path: endpoint.path,
        context: {
          ...authCtx,
          ...context.context,
        },
      };

      const plugins = options.plugins || [];
      const beforeHooks = plugins
        .map((plugin) => {
          if (plugin.hooks?.before) {
            return plugin.hooks.before;
          }
        })
        .filter((plugin) => plugin !== undefined)
        .flat();
      const afterHooks = plugins
        .map((plugin) => {
          if (plugin.hooks?.after) {
            return plugin.hooks.after;
          }
        })
        .filter((plugin) => plugin !== undefined)
        .flat();
      if (options.hooks?.before) {
        beforeHooks.push({
          matcher: () => true,
          handler: options.hooks.before,
        });
      }
      if (options.hooks?.after) {
        afterHooks.push({
          matcher: () => true,
          handler: options.hooks.after,
        });
      }
      for (const hook of beforeHooks) {
        if (!hook.matcher(internalContext)) continue;
        const hookRes = await hook.handler(internalContext);
        if (hookRes && "context" in hookRes) {
          // modify the context with the response from the hook
          internalContext = {
            ...internalContext,
            ...hookRes.context,
          };
          continue;
        }

        if (hookRes) {
          // return with the response from the hook
          return hookRes;
        }
      }

      let endpointRes: any;
      try {
        //@ts-ignore
        endpointRes = await endpoint(internalContext);
        if (newSession) {
          internalContext.context.newSession = newSession;
        }
      } catch (e) {
        if (newSession) {
          internalContext.context.newSession = newSession;
        }
        if (e instanceof APIError) {
          /**
           * If there are no after plugins, we can directly throw the error
           */
          if (!afterHooks?.length) {
            e.headers = endpoint.headers;
            throw e;
          }
          internalContext.context.returned = e;
          internalContext.context.returned.headers = endpoint.headers;
          for (const hook of afterHooks || []) {
            const match = hook.matcher(internalContext);
            if (match) {
              try {
                const hookRes = await hook.handler(internalContext);
                if (hookRes && "response" in hookRes) {
                  internalContext.context.returned = hookRes.response;
                }
              } catch (e) {
                if (e instanceof APIError) {
                  internalContext.context.returned = e;
                  continue;
                }
                throw e;
              }
            }
          }
          if (internalContext.context.returned instanceof APIError) {
            // set the headers from the endpoint
            internalContext.context.returned.headers = endpoint.headers;
            throw internalContext.context.returned;
          }

          return internalContext.context.returned;
        }
        throw e;
      }
      internalContext.context.returned = endpointRes;
      internalContext.responseHeader = endpoint.headers;
      for (const hook of afterHooks) {
        const match = hook.matcher(internalContext);
        if (match) {
          try {
            const hookRes = await hook.handler(internalContext);
            if (hookRes) {
              if ("responseHeader" in hookRes) {
                const headers = hookRes.responseHeader as Headers;
                internalContext.responseHeader = headers;
              } else {
                internalContext.context.returned = hookRes;
              }
            }
          } catch (e) {
            if (e instanceof APIError) {
              internalContext.context.returned = e;
              continue;
            }
            throw e;
          }
        }
      }
      const response = internalContext.context.returned;
      if (response instanceof Response) {
        endpoint.headers.forEach((value, key) => {
          if (key === "set-cookie") {
            response.headers.append(key, value);
          } else {
            response.headers.set(key, value);
          }
        });
      }
      if (response instanceof APIError) {
        response.headers = endpoint.headers;
        throw response;
      }
      return response;
    };
    api[key].path = endpoint.path;
    api[key].method = endpoint.method;
    api[key].options = endpoint.options;
    api[key].headers = endpoint.headers;
  }
  return {
    api: api as typeof endpoints & PluginEndpoint,
    middlewares,
  };
}

export const router = <C extends ChironContext, Option extends ChironOptions>(
  ctx: C,
  options: Option
) => {
  const { api, middlewares } = getEndpoints(ctx, options);
  const basePath = new URL(ctx.baseURL).pathname;

  return createRouter(api, {
    extraContext: ctx,
    basePath,
    routerMiddleware: [
      // TODO: Add origin check middleware
      //   {
      //     path: "/**",
      //     middleware: originCheckMiddleware,
      //   },
      ...middlewares,
    ],
    async onRequest(req) {
      for (const plugin of ctx.options.plugins || []) {
        if (plugin.onRequest) {
          const response = await plugin.onRequest(req, ctx);
          if (response && "response" in response) {
            return response.response;
          }
        }
      }
      return onRequestRateLimit(req, ctx);
    },
    async onResponse(res) {
      for (const plugin of ctx.options.plugins || []) {
        if (plugin.onResponse) {
          const response = await plugin.onResponse(res, ctx);
          if (response) {
            return response.response;
          }
        }
      }
      return res;
    },
    onError(e) {
      if (e instanceof APIError && e.status === "FOUND") {
        return;
      }
      if (options.onAPIError?.throw) {
        throw e;
      }
      if (options.onAPIError?.onError) {
        options.onAPIError.onError(e, ctx);
        return;
      }

      const optLogLevel = options.logger?.level;
      const log =
        optLogLevel === "error" ||
        optLogLevel === "warn" ||
        optLogLevel === "debug"
          ? logger
          : undefined;
      if (options.logger?.disabled !== true) {
        if (
          e &&
          typeof e === "object" &&
          "message" in e &&
          typeof e.message === "string"
        ) {
          if (
            e.message.includes("no column") ||
            e.message.includes("column") ||
            e.message.includes("relation") ||
            e.message.includes("table") ||
            e.message.includes("does not exist")
          ) {
            ctx.logger?.error(e.message);
            return;
          }
        }

        if (e instanceof APIError) {
          if (e.status === "INTERNAL_SERVER_ERROR") {
            ctx.logger.error(e.status, e);
          }
          log?.error(e.message);
        } else {
          ctx.logger?.error(
            e && typeof e === "object" && "name" in e ? (e.name as string) : "",
            e
          );
        }
      }
    },
  });
};

export * from "./routes";
export * from "./middlewares";
export * from "./call";
export { APIError } from "better-call";
