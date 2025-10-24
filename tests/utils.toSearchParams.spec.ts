import { describe, it, expect } from "vitest";
import { toSearchParams } from "../src/utils";
import { Params } from "../dist";

describe("toSearchParams", () => {
  it("returns empty string for undefined/null/others", () => {
    expect(toSearchParams(undefined)).toBe("");
    expect(toSearchParams(null as unknown as Params)).toBe("");
  });

  it("accepts URLSearchParams instance", () => {
    const usp = new URLSearchParams({ a: "1", b: "x" });
    expect(toSearchParams(usp)).toBe("?a=1&b=x");
  });

  it("accepts entries array", () => {
    const entries: [string, string][] = [
      ["a", "1"],
      ["b", "2"],
    ];
    expect(toSearchParams(entries)).toBe("?a=1&b=2");
  });

  it("accepts querystring string (with or without leading ?)", () => {
    expect(toSearchParams("a=1&b=2")).toBe("?a=1&b=2");
    expect(toSearchParams("?a=1&b=2")).toBe("?a=1&b=2");
  });

  it("accepts object with string and number values", () => {
    expect(
      toSearchParams({ a: 1, b: "x" }) === "?a=1&b=x" ||
        toSearchParams({ a: 1, b: "x" }) === "?b=x&a=1"
    ).toBe(true);
  });

  it("skips null/undefined values", () => {
    const q = toSearchParams({ a: "1", b: null, c: undefined });
    expect(["?a=1", "?a=1"]).toContain(q);
  });

  it("supports string[] values by repeating keys", () => {
    const q = toSearchParams({ tags: ["a", "b"], page: 1 });
    expect([
      "?tags=a&tags=b&page=1",
      "?page=1&tags=a&tags=b",
      "?tags=b&tags=a&page=1",
      "?page=1&tags=b&tags=a",
    ]).toContain(q);
  });

  it("supports number[] values by repeating keys", () => {
    const q = toSearchParams({ tags: [1, 2], page: 1 });
    expect([
      "?tags=1&tags=2&page=1",
      "?page=1&tags=1&tags=2",
      "?tags=2&tags=1&page=1",
      "?page=1&tags=2&tags=1",
    ]).toContain(q);
  });
});
