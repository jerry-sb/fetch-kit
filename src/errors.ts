import {
  type HttpErrorKind,
  type HttpErrorInit,
  type HttpMethod,
} from "./types";

export abstract class BaseHttpError<P = unknown> extends Error {
  public abstract readonly kind: HttpErrorKind;
  public readonly url: string;
  public readonly method: HttpMethod;
  public readonly payload?: P;

  protected constructor(kind: HttpErrorKind, init: HttpErrorInit<P>) {
    super(init.message ?? kind);
    this.name = `${kind}Error`;
    this.url = init.url;
    this.method = init.method;
    this.payload = init.payload;
    this.cause = init.cause;
  }

  toJSON() {
    return {
      name: this.name,
      kind: this.kind,
      message: this.message,
      url: this.url,
      method: this.method,
      payload: this.payload,
    };
  }
}

export class FetchError<P = unknown, E = unknown> extends BaseHttpError<P> {
  public readonly kind = "FETCH" as const;
  public readonly code: number;
  public readonly data?: E;
  constructor(code: number, init: HttpErrorInit<P> & { data?: E }) {
    super("FETCH", init);
    this.code = code;
    this.data = init.data;
    this.name = "FetchError";
  }
}

export class TimeoutError<P = unknown> extends BaseHttpError<P> {
  public readonly kind = "TIMEOUT" as const;
  constructor(init: HttpErrorInit<P>) {
    super("TIMEOUT", init);
    this.name = "TimeoutError";
  }
}

export class InternalServerError<P = unknown> extends BaseHttpError<P> {
  public readonly kind = "INTERNAL" as const;
  constructor(init: HttpErrorInit<P>) {
    super("INTERNAL", init);
    this.name = "InternalServerError";
  }
}
