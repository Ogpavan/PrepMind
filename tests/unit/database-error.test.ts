import { describe, expect, it } from "vitest";
import { hasDatabaseErrorCode } from "@/shared/errors/database-error";

describe("database error inspection", () => {
  it("finds a PostgreSQL code wrapped by a query error", () => {
    const error = new Error("Query failed", { cause: Object.assign(new Error("Foreign key violation"), { code: "23503" }) });
    expect(hasDatabaseErrorCode(error, "23503")).toBe(true);
  });

  it("returns false for unrelated and cyclic errors", () => {
    const error = new Error("Unknown");
    Object.assign(error, { cause: error });
    expect(hasDatabaseErrorCode(error, "23503")).toBe(false);
  });
});
