import { type BodyParse, type ParsedByMode, type Params } from "./types";

export function isJson(res: Response) {
  return (res.headers.get("content-type") || "").includes("application/json");
}

export async function parseByMode<M extends BodyParse, J = unknown>(
  res: Response,
  mode: BodyParse
) {
  switch (mode) {
    case "text":
      return res.text() as Promise<ParsedByMode<M, J>>;
    case "blob":
      return res.blob() as Promise<ParsedByMode<M, J>>;
    case "arrayBuffer":
      return res.arrayBuffer() as Promise<ParsedByMode<M, J>>;
    case "none":
      return Promise.resolve(null) as Promise<ParsedByMode<M, J>>;
    default:
      // 'json'
      return res.json() as Promise<ParsedByMode<M, J>>;
  }
}

export function toSearchParams(params?: Params): string {
  if (!params) return "";

  let usp: URLSearchParams;

  // 1. URLSearchParams 인스턴스인 경우
  if (params instanceof URLSearchParams) {
    usp = params;
  }
  // 2. 배열([key, value][]) 형태인 경우 [["a", "1"], ["b", "2"]]
  else if (Array.isArray(params)) {
    usp = new URLSearchParams(params);
  }
  // 3. 문자열 형태인 경우 (예: "?a=1&b=2")
  else if (typeof params === "string") {
    usp = new URLSearchParams(params);
  } else if (typeof params === "object") {
    usp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => usp.append(key, String(v)));
      } else {
        usp.set(key, String(value));
      }
    });
  } else {
    return "";
  }

  // URLSearchParams.toString()는 공백을 '+'로 인코딩(W3C form 규격)하지만,
  // REST API에서는 RFC 3986의 '%20'이 표준이므로 변환한다.
  const qs = usp.toString().replaceAll("+", "%20");
  return qs ? `?${qs}` : "";
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

export function extractMessage(val: unknown): string | undefined {
  if (typeof val === "string") return val;

  if (isRecord(val)) {
    // 공통 에러 필드 우선순위: message → detail → error.message
    for (const key of ["message", "detail", "title"] as const) {
      const v = val[key];
      if (typeof v === "string" && v.length > 0) return v;
    }

    const err = val["error"];
    if (isRecord(err) && typeof err["message"] === "string") {
      return err["message"];
    }
  }

  return undefined;
}
