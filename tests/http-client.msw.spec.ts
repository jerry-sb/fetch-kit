import { describe, it, expect } from "vitest";
import { createHttpClient } from "../src/client";

type SR<T> = { code: number; message: string; data: T };
type User = { id: string; name: string };

describe("http-client + MSW", () => {
  it("JSON + select works (MSW)", async () => {
    const http = createHttpClient({
      baseUrl: "https://api.example.com",
    });

    const user = await http.get<SR<User>, User>("/users/42", undefined, {
      parse: "json",
      select: (r) => (r as SR<User>).data,
    });

    expect(user).toEqual({ id: "42", name: "Lee" });
  });

  it("before middleware can add headers/query (MSW sees them)", async () => {
    const http = createHttpClient({
      baseUrl: "https://api.example.com",
      before: [
        (ctx) => {
          const u = new URL(ctx.url);
          u.searchParams.set("locale", "ko");
          ctx.url = u.toString();
          ctx.init.headers = {
            ...(ctx.init.headers || {}),
            Authorization: "Bearer ABC",
          };
        },
      ],
    });

    const pong = await http.get<string>("/ping", undefined, { parse: "text" });
    expect(pong).toBe("pong");
  });
});
