## @jerryshim/fetch-kit

Lightweight fetch-based HTTP client with middleware, typed errors, and flexible parsing.

### Installation

```bash
pnpm add @jerryshim/fetch-kit
# or
npm i @jerryshim/fetch-kit
# or
yarn add @jerryshim/fetch-kit
```

### Quick Start

```ts
import { createHttpClient } from "@jerryshim/fetch-kit";

type SR<T> = { code: number; message: string; data: T };
type User = { id: string; name: string };

const http = createHttpClient({
  baseUrl: "https://api.example.com",
  before: [
    (ctx) => {
      const u = new URL(ctx.url);
      u.searchParams.set("locale", "en");
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

- `createHttpClient<E = unknown, Expand = unknown>(options)` → returns an object with:
  - `request(path, method, body?, init?)`
  - `get(path, params?, init?)`
  - `post(path, body?, init?)`
  - `patch(path, body?, init?)`
  - `put(path, body?, init?)`
  - `del(path, params?, init?)`

#### Params (querystring)

`get`/`del` accept `params` to build the querystring. Supported forms:

- `URLSearchParams`
- `Array<[string, string]>`
- `string` (e.g., `"a=1&b=2"` or `"?a=1&b=2"`)
- `Record<string, string | number>` — values are stringified; `null`/`undefined` are skipped; `string[]`/`number[]` repeat keys.

Examples:

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

#### Options

- `baseUrl?: string`
- `defaults?: RequestInit & { timeout?: number } & Expand`
- `decodeError?: ({ response, context }) => Promise<{ message?: string; data?: E } | void>`
- `before?: Array<(ctx: RequestContext) => void | Promise<void>>`
- `after?: Array<(ctx: RequestContext, res: Response) => Response | void | Promise<Response | void>>`
- `onError?: (ctx: RequestContext, error: unknown) => Promise<Response | void>`

#### Request options

- `timeout?: number` (ms)
- `parse?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'none'` (default: `'json'`)
- `select?: (parsed) => any`
- `decodeError?: same as global`

### Errors

- `FetchError` — non-2xx HTTP responses. Includes `code`, `data`.
- `TimeoutError` — `AbortError` mapped when timeout triggers.
- `InternalServerError` — unexpected runtime errors.

### Middleware

- `before` — mutate `ctx.url`, `ctx.init`, and `ctx.body` before fetch.
- `after` — inspect/replace `Response` before parsing; chainable.
- `onError` — recover from thrown errors by returning a `Response`.

### TypeScript & Expand passthrough

You can pass extra fields through `defaults`/per-call `init` via the `Expand` generic, e.g., Next.js `next`/`cache` fields.

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

### Notes

- Works in Node 18+ and browsers where `fetch` is available.
- Ships ESM and CJS builds; see `package.json` exports.
