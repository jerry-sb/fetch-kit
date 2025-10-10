---
"@jerryshim/fetch-kit": minor
---

## 한국어

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
