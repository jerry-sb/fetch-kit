import { FetchError, TimeoutError, InternalServerError } from "./errors";
import type {
  Params,
  HttpMethod,
  RequestOptionInit,
  RequestContext as _RequestContext, // 원본 타입을 별칭으로
  BeforeRequest,
  AfterResponse,
  HttpClientOptions,
  RequestOptions,
  BodyParse,
} from "./types";
import { extractMessage, isJson, parseByMode, toSearchParams } from "./utils";

export function createHttpClient<E = unknown, Expand = unknown>(
  opts: HttpClientOptions<E> & { defaults?: RequestOptionInit & Expand } = {}
) {
  // 내부 전용 확장 타입들
  type XInit = RequestOptionInit & Partial<Expand>;
  type XRequestOptions<Parsed, Selected> = RequestOptions<E, Parsed, Selected> &
    Partial<Expand>;

  // RequestContext.init 도 확장된 init을 갖도록 내부에서만 재선언
  type XRequestContext = Omit<_RequestContext, "init"> & { init: XInit };

  const {
    baseUrl = "",
    defaults = { timeout: 10_000 } as XInit,
    decodeError: decodeErrorGlobal,
    before = [] as BeforeRequest[],
    after = [] as AfterResponse[],
    onError,
  } = opts;

  function normalizeOptions<Parsed, Selected = Parsed>(
    init: XRequestOptions<Parsed, Selected> | undefined
  ) {
    const {
      parse = "json",
      select,
      decodeError,
      timeout,
      ...fetchInit
    } = (init ?? {}) as XRequestOptions<Parsed, Selected>;

    const fetchOptions: XInit = {
      ...defaults,
      ...fetchInit,
      ...(timeout !== undefined ? { timeout } : {}),
    };

    return { parse, select, decodeError, fetchOptions };
  }

  function buildContext<Req>(
    url: string,
    method: HttpMethod,
    fetchOptions: XInit,
    body?: Req
  ): XRequestContext {
    return { url, method, init: fetchOptions, body: body as unknown };
  }

  async function applyBeforeMiddleware(ctx: XRequestContext) {
    for (const b of before) await b(ctx as unknown as _RequestContext);
  }

  function createAbort(timeout?: number) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout ?? 10_000);
    return { signal: ctrl.signal, clear: () => clearTimeout(t) };
  }

  async function doFetch<Req>(
    ctx: XRequestContext,
    signal: AbortSignal,
    body?: Req
  ) {
    return fetch(ctx.url, {
      ...ctx.init,
      method: ctx.method,
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(ctx.init.headers || {}),
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
  }

  async function applyAfterResponseMiddleware(
    ctx: XRequestContext,
    res: Response
  ): Promise<Response> {
    let curr = res;
    for (const a of after) {
      const maybe = await a(ctx as unknown as _RequestContext, curr);
      if (maybe instanceof Response) curr = maybe;
    }
    return curr;
  }

  async function decodeErrorOrFallback(
    res: Response,
    ctx: XRequestContext,
    decoder?: HttpClientOptions<E>["decodeError"]
  ): Promise<{ message: string; data?: E }> {
    let message = res.statusText;
    let data: E | undefined;
    try {
      if (decoder) {
        const out = await decoder({
          response: res.clone(),
          context: ctx as unknown as _RequestContext,
        });
        if (out) return { message: out.message ?? message, data: out.data };
      }
      if (isJson(res)) {
        const parsed: unknown = await res.clone().json();
        const m = extractMessage(parsed);
        if (m) message = m;
        data = parsed as E;
      }
    } catch (e) {
      console.error(e);
    }
    return { message, data };
  }

  function throwFetchError<Req>(
    res: Response,
    ctx: XRequestContext,
    message: string,
    data?: E,
    payload?: Req
  ): never {
    throw new FetchError<Req, E>(res.status, {
      url: ctx.url,
      method: ctx.method,
      payload,
      message,
      data,
    });
  }

  async function handleErrorResponse<Req>(
    res: Response,
    ctx: XRequestContext,
    decoder?: HttpClientOptions<E>["decodeError"],
    payload?: Req
  ): Promise<never> {
    const { message, data } = await decodeErrorOrFallback(res, ctx, decoder);
    throwFetchError(res, ctx, message, data, payload);
  }

  async function parseSuccess<Parsed>(
    res: Response,
    mode: BodyParse
  ): Promise<Parsed> {
    return (await parseByMode<typeof mode, Parsed>(res, mode)) as Parsed;
  }

  function finalizeSelected<Parsed, Selected = Parsed>(
    parsed: Parsed,
    select?: (p: Parsed) => Selected
  ): Selected {
    return select ? select(parsed) : (parsed as unknown as Selected);
  }

  async function tryOnErrorRecovery<Req, Parsed, Selected = Parsed>(
    err: unknown,
    ctx: XRequestContext,
    init: XRequestOptions<Parsed, Selected> | undefined,
    payload?: Req
  ): Promise<Selected> {
    if (!onError) throw err;
    const recovered = await onError(ctx as unknown as _RequestContext, err);
    if (!(recovered instanceof Response)) throw err;

    const res = await applyAfterResponseMiddleware(ctx, recovered);
    if (!res.ok) {
      const decoder = init?.decodeError ?? decodeErrorGlobal;
      await handleErrorResponse(res, ctx, decoder, payload);
    }
    const parsed = await parseSuccess<Parsed>(res, init?.parse ?? "json");
    return finalizeSelected<Parsed, Selected>(parsed, init?.select);
  }

  // ---------- Core ----------
  async function run<Req, Parsed, Selected = Parsed>(
    path: string,
    method: HttpMethod,
    body?: Req,
    init?: XRequestOptions<Parsed, Selected>
  ): Promise<Selected> {
    const { parse, select, decodeError, fetchOptions } = normalizeOptions<
      Parsed,
      Selected
    >(init);
    const ctx = buildContext<Req>(
      `${baseUrl}${path}`,
      method,
      fetchOptions,
      body
    );

    await applyBeforeMiddleware(ctx);
    const { signal, clear } = createAbort(ctx.init.timeout);

    try {
      let res = await doFetch(ctx, signal, body);
      res = await applyAfterResponseMiddleware(ctx, res);
      if (!res.ok) {
        const decoder = decodeError ?? decodeErrorGlobal;
        await handleErrorResponse(res, ctx, decoder, body);
      }
      const parsed = await parseSuccess<Parsed>(res, parse);
      return finalizeSelected<Parsed, Selected>(parsed, select);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new TimeoutError({
          url: ctx.url,
          method: ctx.method,
          payload: body,
          message: "Request timed out",
        });
      }
      if (err instanceof FetchError) throw err;
      try {
        return await tryOnErrorRecovery<Req, Parsed, Selected>(
          err,
          ctx,
          init,
          body
        );
      } catch (e) {
        if (e instanceof FetchError) throw e;
        throw new InternalServerError({
          url: ctx.url,
          method: ctx.method,
          payload: body,
          cause: e,
        });
      }
    } finally {
      clear();
    }
  }

  // ---------- Public API ----------
  return {
    request: run,

    get: <Parsed, Selected = Parsed>(
      path: string,
      params?: Params,
      init?: XRequestOptions<Parsed, Selected>
    ) =>
      run<never, Parsed, Selected>(
        `${path}${toSearchParams(params)}`,
        "GET",
        undefined,
        init
      ),

    post: <Req, Parsed, Selected = Parsed>(
      path: string,
      body?: Req,
      init?: XRequestOptions<Parsed, Selected>
    ) => run<Req, Parsed, Selected>(path, "POST", body, init),

    patch: <Req, Parsed, Selected = Parsed>(
      path: string,
      body?: Req,
      init?: XRequestOptions<Parsed, Selected>
    ) => run<Req, Parsed, Selected>(path, "PATCH", body, init),

    put: <Req, Parsed, Selected = Parsed>(
      path: string,
      body?: Req,
      init?: XRequestOptions<Parsed, Selected>
    ) => run<Req, Parsed, Selected>(path, "PUT", body, init),

    del: <Parsed, Selected = Parsed>(
      path: string,
      params?: Params,
      init?: XRequestOptions<Parsed, Selected>
    ) =>
      run<never, Parsed, Selected>(
        `${path}${toSearchParams(params)}`,
        "DELETE",
        undefined,
        init
      ),
  };
}
