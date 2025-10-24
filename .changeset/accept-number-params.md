---
"@jerryshim/fetch-kit": minor
---

## 한국어

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
