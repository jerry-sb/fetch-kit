import { delay, http, HttpResponse } from "msw";

// 공통 JSON 응답 헬퍼 (타입 안전하게 HttpResponse.json의 매개변수 타입을 재사용)
const json = (
  data: Parameters<typeof HttpResponse.json>[0],
  init?: ResponseInit
) => HttpResponse.json(data, init);

// 예시 엔드포인트들
export const handlers = [
  // 성공: JSON
  http.get("https://api.example.com/users/:id", ({ params }) => {
    return json({
      code: 0,
      message: "ok",
      data: { id: params.id, name: "Lee" },
    });
  }),

  // 에러: JSON with message
  http.get("https://api.example.com/fail-json", () => {
    return json(
      { message: "bad things" },
      { status: 400, statusText: "Bad Request" }
    );
  }),

  // 에러: text/plain
  http.get("https://api.example.com/fail-text", () => {
    return new HttpResponse("plain error", {
      status: 400,
      statusText: "Bad Request",
      headers: { "content-type": "text/plain" },
    });
  }),

  // 성공: text
  http.get("https://api.example.com/ping", () => {
    return new HttpResponse("pong", {
      headers: { "content-type": "text/plain" },
    });
  }),

  http.get("https://api.example.com/slow", async () => {
    await delay(2000);
    return new HttpResponse("pong", {
      headers: { "content-type": "text/plain" },
    });
  }),

  // 미들웨어 테스트용: before에서 추가한 헤더/쿼리 검증
  http.get("https://api.example.com/echo", ({ request }) => {
    const url = new URL(request.url);
    const auth = request.headers.get("authorization");
    const locale = url.searchParams.get("locale");
    return json({ auth, locale });
  }),

  // 미들웨어 테스트용: after에서 교체할 수 있도록 원본은 418
  http.get("https://api.example.com/teapot", () => {
    return json({ ok: false }, { status: 418, statusText: "I'm a teapot" });
  }),

  // onError 복구 테스트용: 첫 요청에서 네트워크 오류 유도
  http.get("https://api.example.com/flaky", () => {
    return HttpResponse.error();
  }),
];
