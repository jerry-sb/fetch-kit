import {
  type FetchError,
  type InternalServerError,
  type TimeoutError,
} from "./errors";

export type Params =
  | string[][]
  | Record<string, string>
  | string
  | URLSearchParams;

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
export type HttpErrorKind = "FETCH" | "TIMEOUT" | "INTERNAL";
export type BodyParse = "json" | "text" | "blob" | "arrayBuffer" | "none";
export type RequestOptionInit = RequestInit & { timeout?: number };
export type ParsedByMode<M extends BodyParse, J> = {
  json: J;
  text: string;
  blob: Blob;
  arrayBuffer: ArrayBuffer;
  none: null;
}[M];

export interface HttpErrorInit<P = unknown> {
  url: string;
  method: HttpMethod;
  payload?: P;
  message?: string;
  cause?: unknown;
}

export type HttpError<E = unknown, P = unknown> =
  | FetchError<P, E>
  | TimeoutError<P>
  | InternalServerError<P>;

export interface RequestContext {
  url: string;
  method: HttpMethod;
  init: RequestOptionInit;
  body: unknown;
}

export type ErrorDecoder<E> = (args: {
  response: Response;
  context: RequestContext;
}) => Promise<{ message?: string; data?: E } | void>;

export type BeforeRequest = (ctx: RequestContext) => Promise<void> | void;

export type AfterResponse = (
  ctx: RequestContext,
  res: Response
) => Promise<Response | void> | Response | void;

export type OnError = (
  ctx: RequestContext,
  error: unknown
) => Promise<Response | void>;

export interface HttpClientOptions<E> {
  baseUrl?: string;
  defaults?: RequestOptionInit;
  decodeError?: ErrorDecoder<E>;
  before?: BeforeRequest[];
  after?: AfterResponse[];
  onError?: OnError;
}

export interface RequestOptions<E, Parsed = unknown, Selected = Parsed>
  extends RequestInit {
  timeout?: number;
  parse?: BodyParse;
  select?: (parsed: Parsed) => Selected;
  decodeError?: ErrorDecoder<E>;
}
