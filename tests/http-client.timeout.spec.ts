import { describe, it, expect, vi } from "vitest";
import { TimeoutError } from "../src/errors";
import { createHttpClient } from "../src/client";

describe("timeout (mapping only)", () => {
  it("schedules timeout and maps AbortError to TimeoutError", async () => {
    const st = vi.spyOn(globalThis, "setTimeout");

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      Object.assign(new Error("Aborted"), { name: "AbortError" })
    );

    const http = createHttpClient({
      baseUrl: "https://api.example.com",
      defaults: { timeout: 100 },
    });

    await expect(
      http.get("/slow", undefined, { parse: "text" })
    ).rejects.toBeInstanceOf(TimeoutError);

    // 타임아웃이 100ms로 스케줄 되었는지 검증
    expect(st).toHaveBeenCalled();
    expect(st.mock.calls[0][1]).toBe(100);
  });
});
