---
"fetch-kit": minor
---

## 한국어

- **요약**: `fetch` 기반의 가벼운 HTTP 클라이언트 최초 공개. 미들웨어(`before`, `after`, `onError`), 커스텀 에러(`FetchError`, `TimeoutError`, `InternalServerError`), 파서 모드(`json|text|blob|arrayBuffer|none`), 타임아웃, 기본 옵션/확장(`defaults`) 지원.
- **변경 사항**
  - `createHttpClient`로 클라이언트 생성 및 `get/post/patch/put/del/request` 메서드 제공.
  - 글로벌 및 per-request `decodeError`로 서버 에러 페이로드를 의미 있는 메시지로 매핑.
  - `before/after` 미들웨어로 요청/응답 가공, `onError`로 네트워크 오류 복구.
  - `RequestInit` 확장(`timeout` 등)과 제네릭 확장(예: Next.js `next`, `cache`) 패스스루.
  - 광범위한 테스트(MSW) 추가.
- **마이그레이션**: 최초 배포로 마이그레이션 없음.
- **참고**: `README.md`의 Quick Start 및 API 섹션 참고.

## English

- **Summary**: Initial release of a lightweight `fetch`-based HTTP client. Features middleware (`before`, `after`, `onError`), custom errors (`FetchError`, `TimeoutError`, `InternalServerError`), body parse modes (`json|text|blob|arrayBuffer|none`), timeout, and `defaults`/generic init passthrough.
- **Changes**
  - Introduce `createHttpClient` with `get/post/patch/put/del/request` helpers.
  - Global and per-request `decodeError` to map server error payloads to meaningful messages.
  - `before/after` middleware for request/response shaping, and `onError` for network error recovery.
  - `RequestInit` extensions (`timeout`) and generic passthrough (e.g., Next.js `next`, `cache`).
  - Comprehensive MSW test coverage.
- **Migration**: N/A for the first release.
- **Refs**: See Quick Start and API in `README.md`.
