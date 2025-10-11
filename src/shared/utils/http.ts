// HTTP-specific types for HTTP status codes

// Success variants with HTTP status codes
export type HttpSuccess<T> =
  | { status: 200; value: T }
  | { status: 201; value: T };

// Error variants with HTTP status codes
// publicErrMsg = sanitized error message safe for public/user display
export type HttpError =
  | { status: 400; publicErrMsg: string }
  | { status: 404; publicErrMsg: string }
  | { status: 500; publicErrMsg: string };

// Helpers
const ok = <T>(value: T): HttpSuccess<T> => ({ status: 200, value });

const created = <T>(value: T): HttpSuccess<T> => ({ status: 201, value });

const badRequest = (publicErrMsg: string): HttpError => ({ status: 400, publicErrMsg });

const notFound = (publicErrMsg: string): HttpError => ({ status: 404, publicErrMsg });

const serverError = (publicErrMsg: string): HttpError => ({ status: 500, publicErrMsg });

export const Http = { ok, created, badRequest, notFound, serverError };
