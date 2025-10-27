# @jerryshim/fetch-kit

## 1.3.0

### Minor Changes

- 348d1df: ## 한국어
  - **요약**: `Params`에서 숫자 및 배열(string[]/number[]) 값을 지원하고, `null`/`undefined`는 자동으로 생략되도록 개선했습니다. 또한 숫자 값은 문자열로 안전하게 변환됩니다.
  - **변경 사항**
    - `Params` 타입을 `Record<string, string | number>`로 확장(숫자 허용).
    - 객체 값이 `string[]`/`number[]`인 경우 동일 키를 반복하여 쿼리 생성(e.g. `tags=a&tags=b`).
    - `null`/`undefined` 값은 쿼리에서 생략.
    - `toSearchParams`가 숫자 값을 `String(value)`로 변환.
    - `createHttpClient.get`/`del`이 위 규칙을 그대로 적용해 URL을 조립.
  - **마이그레이션**: 없음 (하위 호환 변경)
  - **참고**: 변경 파일 `src/types.ts`, `src/utils.ts`

  ## English
  - **Summary**: Support numeric and array (string[]/number[]) values in `Params`, skip `null`/`undefined`, and safely stringify numbers.
  - **Changes**
    - Expand `Params` type to `Record<string, string | number>` (allow numbers).
    - When object values are `string[]`/`number[]`, repeat the same key (e.g., `tags=a&tags=b`).
    - Skip `null`/`undefined` entries.
    - `toSearchParams` stringifies numeric values with `String(value)`.
    - `createHttpClient.get`/`del` use the same rules when assembling URLs.
  - **Migration**: None (backward compatible)
  - **Refs**: Updated files `src/types.ts`, `src/utils.ts`

## 1.2.0

### Minor Changes

- 87a1b7b: ## 한국어
  - **요약**: `Params` 객체에서 숫자 값 지원을 추가하고, `toSearchParams`가 숫자 값을 문자열로 안전하게 변환하도록 개선했습니다.
  - **변경 사항**
    - `Params` 타입을 `Record<string, string | number>`로 확장하여 숫자 값을 허용.
    - `toSearchParams`가 객체 값이 `number`인 경우 `String(value)`로 변환해 쿼리 스트링을 생성.
  - **마이그레이션**: 없음 (하위 호환 변경)
  - **참고**: 변경 파일 `src/types.ts`, `src/utils.ts`

  ## English
  - **Summary**: Add support for numeric values in `Params` objects and make `toSearchParams` safely stringify numeric values.
  - **Changes**
    - Expand `Params` type to `Record<string, string | number>` to allow numbers.
    - Update `toSearchParams` to convert numeric values with `String(value)` before building the query string.
  - **Migration**: None (backward compatible)
  - **Refs**: Updated files `src/types.ts`, `src/utils.ts`

## 1.1.0

### Minor Changes

- e61c7a7: ## 한국어
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
