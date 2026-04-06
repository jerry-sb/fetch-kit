## @jerryshim/fetch-kit

미들웨어, 타입드 에러, 유연한 파싱을 지원하는 경량 `fetch` 기반 HTTP 클라이언트입니다.

### 설치

```bash
pnpm add @jerryshim/fetch-kit
# 또는
npm i @jerryshim/fetch-kit
# 또는
yarn add @jerryshim/fetch-kit
```

### 빠른 시작

```ts
import { createHttpClient } from "@jerryshim/fetch-kit";

type SR<T> = { code: number; message: string; data: T };
type User = { id: string; name: string };

const http = createHttpClient({
  baseUrl: "https://api.example.com",
  before: [
    (ctx) => {
      const u = new URL(ctx.url);
      u.searchParams.set("locale", "ko");
      ctx.url = u.toString();
      ctx.init.headers = {
        ...(ctx.init.headers || {}),
        Authorization: "Bearer TOKEN",
      };
    },
  ],
});

const user = await http.get<SR<User>, User>("/users/42", undefined, {
  parse: "json",
  select: (r) => (r as SR<User>).data,
});
```

### API

- `createHttpClient<E = unknown, Expand = unknown>(options)` → 다음 메서드를 갖는 객체 반환:
  - `request(path, method, body?, init?)`
  - `get(path, params?, init?)`
  - `post(path, body?, init?)`
  - `patch(path, body?, init?)`
  - `put(path, body?, init?)`
  - `del(path, params?, init?)`

#### Params (쿼리스트링)

`get`/`del`은 `params`로 쿼리스트링을 생성합니다. 지원 형태:

- `URLSearchParams`
- `Array<[string, string]>`
- `string` (예: `"a=1&b=2"` 또는 `"?a=1&b=2"`)
- `Record<string, string | number>` — 값은 문자열로 변환되며, `null`/`undefined`는 생략됩니다. `string[]`/`number[]`는 동일 키를 반복합니다.

예시:

```ts
http.get("/items", new URLSearchParams({ a: "1", b: "x" }), { parse: "json" });
http.get(
  "/items",
  [
    ["a", "1"],
    ["b", "2"],
  ],
  { parse: "json" }
);
http.get("/items", "page=2&sort=asc", { parse: "text" });
http.get(
  "/items",
  { page: 1, tags: ["a", "b"], q: "x", none: undefined },
  { parse: "json" }
);
// → /items?page=1&tags=a&tags=b&q=x
```

#### 옵션

- `baseUrl?: string`
- `defaults?: RequestInit & { timeout?: number } & Expand`
- `decodeError?: ({ response, context }) => Promise<{ message?: string; data?: E } | void>`
- `before?: Array<(ctx: RequestContext) => void | Promise<void>>`
- `after?: Array<(ctx: RequestContext, res: Response) => Response | void | Promise<Response | void>>`
- `onError?: (ctx: RequestContext, error: unknown) => Promise<Response | void>`

#### 요청 옵션

- `timeout?: number` (ms)
- `parse?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'none'` (기본: `'json'`)
- `select?: (parsed) => any`
- `decodeError?: 글로벌과 동일한 시그니처`

### 에러

- `FetchError` — 2xx가 아닌 HTTP 응답. `code`, `data` 포함.
- `TimeoutError` — 타임아웃 시 발생하는 `AbortError`를 매핑.
- `InternalServerError` — 예기치 않은 런타임 오류.

### 미들웨어

- `before` — `ctx.url`, `ctx.init`, `ctx.body`를 fetch 전 변형.
- `after` — 파싱 전 `Response` 확인/교체; 체이닝 가능.
- `onError` — 오류에서 `Response`를 반환해 복구.

### TypeScript & 확장 패스스루

제네릭 `Expand`를 사용하면 `defaults`/호출별 `init`에 추가 필드를 전달할 수 있습니다(예: Next.js `next`, `cache`).

```ts
type NextExpand = {
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: RequestCache;
};
const http = createHttpClient<unknown, NextExpand>({
  defaults: { timeout: 5000, next: { revalidate: 60 } },
  before: [
    (ctx) => {
      (ctx.init as any).next = { ...(ctx.init as any).next, tags: ["users"] };
    },
  ],
});
```

### 참고

- Node 18+ 및 `fetch` 사용 가능한 브라우저에서 동작합니다.
- ESM/CJS 빌드를 제공합니다. `package.json`의 `exports`를 참고하세요.
