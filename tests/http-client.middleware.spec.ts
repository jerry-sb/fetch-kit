import { describe, it, expect, vi } from "vitest";
import { createHttpClient } from "../src/client";

describe("middleware behaviors", () => {
  it("before can mutate url and headers (echo endpoint)", async () => {
    const http = createHttpClient({
      baseUrl: "https://api.example.com",
      before: [
        (ctx) => {
          const u = new URL(ctx.url);
          u.searchParams.set("locale", "ko");
          ctx.url = u.toString();
          ctx.init.headers = {
            ...(ctx.init.headers || {}),
            Authorization: "Bearer XYZ",
          } as HeadersInit;
        },
      ],
    });

    const out = await http.get<{ auth: string | null; locale: string | null }>(
      "/echo",
      undefined,
      { parse: "json" }
    );
    expect(out.auth).toBe("Bearer XYZ");
    expect(out.locale).toBe("ko");
  });

  it("after can replace a non-ok response with a fixed Response", async () => {
    const http = createHttpClient({
      baseUrl: "https://api.example.com",
      after: [
        async (_ctx, res) => {
          if (!res.ok) {
            const fixed = new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
            return fixed;
          }
        },
      ],
    });

    const out = await http.get<{ ok: boolean }>("/teapot", undefined, {
      parse: "json",
    });
    expect(out.ok).toBe(true);
  });

  it("onError can recover by returning a Response", async () => {
    const spy = vi.fn();
    const http = createHttpClient({
      baseUrl: "https://api.example.com",
      onError: async (_ctx, err) => {
        spy(err);
        return new Response(JSON.stringify({ recovered: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    const out = await http.get<{ recovered: boolean }>("/flaky", undefined, {
      parse: "json",
    });
    expect(spy).toHaveBeenCalled();
    expect(out.recovered).toBe(true);
  });
});
