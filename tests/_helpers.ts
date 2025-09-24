export function resJSON(body: unknown, init: ResponseInit = {}): Response {
  const headers: HeadersInit = {
    "content-type": "application/json",
    ...(init.headers || {}),
  };
  return new Response(JSON.stringify(body), { ...init, headers });
}
export function resText(text: string, init: ResponseInit = {}): Response {
  const headers: HeadersInit = {
    "content-type": "text/plain",
    ...(init.headers || {}),
  };
  return new Response(text, { ...init, headers });
}
export function resBlob(
  data = "PDF",
  type = "application/pdf",
  init: ResponseInit = {}
): Response {
  const b = new Blob([data], { type });
  const headers: HeadersInit = {
    "content-type": type,
    ...(init.headers || {}),
  };
  return new Response(b, { ...init, headers });
}
export function resArrayBuffer(
  data = "abc",
  init: ResponseInit = {}
): Response {
  const ab = new TextEncoder().encode(data).buffer;
  return new Response(ab, { ...init });
}
