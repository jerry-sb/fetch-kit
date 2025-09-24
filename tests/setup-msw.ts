import { setupServer } from "msw/node";
import { beforeAll, afterAll, afterEach } from "vitest";
import { handlers } from "./msw/handlers";

// Node에서 fetch/undici를 가로채는 서버
export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
