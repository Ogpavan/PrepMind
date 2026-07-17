export type ErrorCode = "VALIDATION" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "INTERNAL";

export class ApplicationError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof ApplicationError) {
    return { ok: false, message: error.message, fieldErrors: error.fieldErrors };
  }
  console.error("Unhandled application error", error);
  return { ok: false, message: "Something went wrong. Please try again." };
}
