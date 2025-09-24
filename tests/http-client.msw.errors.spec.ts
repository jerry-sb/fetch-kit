import { describe, it, expect } from "vitest";
import { FetchError } from "../src/errors";
import { createHttpClient } from "../src/client";

type ErrShape = { message?: string; errors?: Array<{ message: string }> };

describe("http-client + MSW errors", () => {
  it("custom decodeError is used", async () => {
    const http = createHttpClient<ErrShape>({
      baseUrl: "https://api.example.com",
      decodeError: async ({ response }) => {
        const j = await response.json();
        return {
          message: j.errors?.[0]?.message ?? j.message ?? "fallback",
          data: j,
        };
      },
    });

    await expect(
      http.get("/fail-json", undefined, { parse: "json" })
    ).rejects.toMatchObject({ name: "FetchError", message: "bad things" });
  });

  it("text error fallback still throws FetchError", async () => {
    const http = createHttpClient({
      baseUrl: "https://api.example.com",
    });

    await expect(
      http.get("/fail-text", undefined, { parse: "json" })
    ).rejects.toBeInstanceOf(FetchError);
  });
});
