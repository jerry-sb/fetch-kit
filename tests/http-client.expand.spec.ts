import { describe, it, expect, vi } from "vitest";
import { resJSON } from "./_helpers";
import { createHttpClient } from "../src/client";

type NextExpand = {
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: RequestCache;
};

describe("Expand generic passthrough", () => {
  it("forwards next/cache to fetch init", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(resJSON({ ok: true }));

    const http = createHttpClient<unknown, NextExpand>({
      defaults: {
        timeout: 5000,
        cache: "force-cache",
        next: { revalidate: 60 },
      },
      before: [
        (ctx) => {
          (ctx.init as RequestInit & NextExpand).next = {
            ...(ctx.init as RequestInit & NextExpand).next,
            tags: ["users"],
          };
        },
      ],
    });

    await http.get("/x", undefined, {
      parse: "json",
      cache: "no-store",
      next: { revalidate: 30 },
    });

    const [, init] = spy.mock.calls[0] as [string, RequestInit & NextExpand];
    expect(init.cache).toBe("no-store");
    expect(init.next?.revalidate).toBe(30);
    expect(init.next?.tags).toEqual(["users"]);
  });
});
