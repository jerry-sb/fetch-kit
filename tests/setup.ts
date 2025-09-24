import { beforeEach, afterEach, vi } from "vitest";

// 각 테스트 간 상태 초기화
beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

// 혹시 잊은 fakeTimers가 있으면 원복
afterEach(() => {
  vi.useRealTimers();
});
