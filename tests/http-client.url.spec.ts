import { describe, it, expect, vi } from "vitest";
import { createHttpClient } from "../src/client";
import { resJSON, resText } from "./_helpers";

describe("http-client URL assembly (get/del)", () => {
  it("appends URLSearchParams", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(resText("ok"));

    const http = createHttpClient({ baseUrl: "https://api.example.com" });
    const usp = new URLSearchParams({ a: "1", b: "x" });
    await http.get("/items", usp, { parse: "text" });
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/items?a=1&b=x");
  });

  it("appends entries array", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(resJSON({ ok: true }));

    const http = createHttpClient({ baseUrl: "https://api.example.com" });
    await http.get(
      "/items",
      [
        ["a", "1"],
        ["b", "2"],
      ],
      { parse: "json" }
    );
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/items?a=1&b=2");
  });

  it("accepts querystring string", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(resText("ok"));

    const http = createHttpClient({ baseUrl: "https://api.example.com" });
    await http.get("/items", "page=2&sort=asc", { parse: "text" });
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/items?page=2&sort=asc");
  });

  it("supports object with string/number and array values", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(resJSON({ ok: true }));

    const http = createHttpClient({ baseUrl: "https://api.example.com" });
    await http.get(
      "/items",
      { page: 1, q: "x", tags: ["a", "b"], skip: null, none: undefined },
      { parse: "json" }
    );
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    // Order of params may vary; check membership instead of strict string match
    expect(url.startsWith("https://api.example.com/items?")).toBe(true);
    const u = new URL(url);
    expect(u.searchParams.get("page")).toBe("1");
    expect(u.searchParams.get("q")).toBe("x");
    expect(u.searchParams.getAll("tags")).toEqual(["a", "b"]);
    expect(u.searchParams.has("skip")).toBe(false);
    expect(u.searchParams.has("none")).toBe(false);
  });

  it("del works with same param handling", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(resText("ok"));

    const http = createHttpClient({ baseUrl: "https://api.example.com" });
    await http.del("/items", { id: 10 }, { parse: "text" });
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/items?id=10");
    expect(init.method).toBe("DELETE");
  });
});
