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

/**
 * 공통 HTTP 클라이언트 팩토리
 *
 * - 에러 처리(FetchError/TimeoutError/InternalServerError) 통일
 * - before/after 미들웨어 지원
 * - decodeError / onError 로 에러 데이터/복구 커스터마이즈
 */
export function createHttpClient<E = unknown, Expand = unknown>(
  opts: HttpClientOptions<E> & { defaults?: RequestOptionInit & Expand } = {}
) {
  // 내부에서만 사용할 fetch init 타입 (확장 옵션 포함)
  type XInit = RequestOptionInit & Partial<Expand>;

  // 각 request 호출 시 사용하는 옵션 타입 (파싱/선택기/에러 decode + 확장 옵션)
  type XRequestOptions<Parsed, Selected> = RequestOptions<E, Parsed, Selected> &
    Partial<Expand>;

  // RequestContext.init 을 확장된 init 타입으로 교체한 내부 컨텍스트
  type XRequestContext = Omit<_RequestContext, "init"> & { init: XInit };

  const {
    baseUrl = "",
    defaults = { timeout: 10_000 } as XInit, // 모든 요청의 기본 fetch 옵션
    decodeError: decodeErrorGlobal, // 전역 에러 decoder
    before = [] as BeforeRequest[], // 요청 전 미들웨어
    after = [] as AfterResponse[], // 응답 후 미들웨어
    onError, // fetch/파싱 단계에서의 복구 핸들러
  } = opts;

  /**
   * 요청 시점에 개별 init 을 기본값(defaults)와 merge 해서
   * 최종 fetch 옵션과 parse/select/decode 설정을 뽑아낸다.
   */
  function normalizeOptions<Parsed, Selected = Parsed>(
    init: XRequestOptions<Parsed, Selected> | undefined
  ) {
    const {
      parse = "json", // 응답 body 파싱 방식 (json / text / blob 등)
      select, // 파싱된 값에서 필요한 부분만 골라내는 함수
      decodeError, // 이 요청에만 적용되는 에러 decoder
      timeout, // 이 요청에만 적용되는 타임아웃
      ...fetchInit // fetch 옵션 (headers, credentials 등)
    } = (init ?? {}) as XRequestOptions<Parsed, Selected>;

    // defaults -> per-request init -> per-request timeout override
    const fetchOptions: XInit = {
      ...defaults,
      ...fetchInit,
      ...(timeout !== undefined ? { timeout } : {}),
    };

    return { parse, select, decodeError, fetchOptions };
  }

  /**
   * 한 요청에 대한 컨텍스트 객체 생성
   */
  function buildContext<Req>(
    url: string,
    method: HttpMethod,
    fetchOptions: XInit,
    body?: Req
  ): XRequestContext {
    return { url, method, init: fetchOptions, body: body as unknown };
  }

  /**
   * before 미들웨어 순차 적용
   * - 주로 header 세팅, 토큰 주입 등에 사용
   */
  async function applyBeforeMiddleware(ctx: XRequestContext) {
    for (const b of before) await b(ctx as unknown as _RequestContext);
  }

  /**
   * AbortController 로 타임아웃 처리 유틸
   */
  function createAbort(timeout?: number) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout ?? 10_000);
    return { signal: ctrl.signal, clear: () => clearTimeout(t) };
  }

  /**
   * 실제 fetch 호출
   * - 기본으로 Content-Type: application/json
   * - body 있으면 JSON.stringify
   */
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

  /**
   * after 미들웨어 순차 적용
   * - 응답 공통 처리 / 로깅 / 리프레시 토큰 등의 후처리에 사용
   */
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

  /**
   * HTTP 에러 응답의 body 를 파싱해서 메시지/데이터를 추출
   * - 우선순위:
   *   1) decoder 가 반환한 message/data
   *   2) JSON body 의 message 필드 추출 (extractMessage)
   *   3) response.statusText
   */
  async function decodeErrorOrFallback(
    res: Response,
    ctx: XRequestContext,
    decoder?: HttpClientOptions<E>["decodeError"]
  ): Promise<{ message: string; data?: E }> {
    let message = res.statusText;
    let data: E | undefined;
    try {
      // 1) 사용자 정의 decodeError 먼저 시도
      if (decoder) {
        const out = await decoder({
          response: res.clone(),
          context: ctx as unknown as _RequestContext,
        });
        if (out) return { message: out.message ?? message, data: out.data };
      }
      // 2) JSON 응답이면 message 추출 시도
      if (isJson(res)) {
        const parsed: unknown = await res.clone().json();
        const m = extractMessage(parsed);
        if (m) message = m;
        data = parsed as E;
      }
    } catch (e) {
      // decode 중 에러가 나도 최종적으로는 statusText 로 fallback
      console.error(e);
    }
    return { message, data };
  }

  /**
   * FetchError 를 생성해서 throw 하는 헬퍼
   */
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

  /**
   * HTTP status 가 !ok 인 경우 (4xx/5xx) 처리
   * - decodeErrorOrFallback 으로 message/data 구성
   * - 결국 FetchError 로 래핑해서 throw
   */
  async function handleErrorResponse<Req>(
    res: Response,
    ctx: XRequestContext,
    decoder?: HttpClientOptions<E>["decodeError"],
    payload?: Req
  ): Promise<never> {
    const { message, data } = await decodeErrorOrFallback(res, ctx, decoder);
    throwFetchError(res, ctx, message, data, payload);
  }

  /**
   * 성공 응답의 body 파싱
   * - parse 모드에 따라 json/text/blob 등 처리
   */
  async function parseSuccess<Parsed>(
    res: Response,
    mode: BodyParse
  ): Promise<Parsed> {
    return (await parseByMode<typeof mode, Parsed>(res, mode)) as Parsed;
  }

  /**
   * select 함수가 있으면 파싱 결과에서 원하는 부분만 추출
   * - 없으면 그대로 반환
   */
  function finalizeSelected<Parsed, Selected = Parsed>(
    parsed: Parsed,
    select?: (p: Parsed) => Selected
  ): Selected {
    return select ? select(parsed) : (parsed as unknown as Selected);
  }

  /**
   * onError 훅을 통한 복구 시도
   * - 네트워크 에러/파싱 에러 등에서 동작
   * - onError 가 Response 를 반환하면 그 응답을 정상 흐름처럼 다시 처리
   */
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
  /**
   * 모든 HTTP 메서드의 공통 실행 함수
   *
   * - before 미들웨어 적용
   * - fetch + after 미들웨어
   * - !ok 응답 → handleErrorResponse
   * - 네트워크/타임아웃/기타 에러 → TimeoutError / FetchError / InternalServerError
   */
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
      // fetch + after 미들웨어
      let res = await doFetch(ctx, signal, body);
      res = await applyAfterResponseMiddleware(ctx, res);

      // HTTP status 에 따른 에러 처리
      if (!res.ok) {
        const decoder = decodeError ?? decodeErrorGlobal;
        await handleErrorResponse(res, ctx, decoder, body);
      }

      // 성공 응답 파싱 및 select 적용
      const parsed = await parseSuccess<Parsed>(res, parse);
      return finalizeSelected<Parsed, Selected>(parsed, select);
    } catch (err) {
      // fetch 타임아웃 → TimeoutError
      if (err instanceof Error && err.name === "AbortError") {
        throw new TimeoutError({
          url: ctx.url,
          method: ctx.method,
          payload: body,
          message: "Request timed out",
        });
      }

      // 이미 FetchError 라면 그대로 밖으로 전달
      if (err instanceof FetchError) throw err;

      // onError 복구 시도
      try {
        return await tryOnErrorRecovery<Req, Parsed, Selected>(
          err,
          ctx,
          init,
          body
        );
      } catch (e) {
        // 복구 시도 후에도 FetchError 라면 그대로 전달
        if (e instanceof FetchError) throw e;

        // 그 밖의 예기치 못한 에러는 InternalServerError 로 래핑
        throw new InternalServerError({
          url: ctx.url,
          method: ctx.method,
          payload: body,
          cause: e,
        });
      }
    } finally {
      // 타임아웃 타이머 정리
      clear();
    }
  }

  // ---------- Public API ----------
  /**
   * 최종으로 노출되는 HTTP 메서드들
   * - get/post/patch/put/delete 모두 run 을 래핑해서 사용
   */
  return {
    // method, path 를 직접 넘길 때 사용
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
