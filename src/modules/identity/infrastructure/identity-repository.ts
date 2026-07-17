import { and, count, eq, gt, sql } from "drizzle-orm";
import { db } from "@/infrastructure/database/client";
import { loginAttempts, users } from "@/infrastructure/database/schema";

export const identityRepository = {
  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${email.toLowerCase()}`).limit(1);
    return user ?? null;
  },

  async countRecentFailures(identifier: string, ipAddress: string, since: Date) {
    const [row] = await db
      .select({ value: count() })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.identifier, identifier.toLowerCase()), eq(loginAttempts.ipAddress, ipAddress), eq(loginAttempts.successful, false), gt(loginAttempts.attemptedAt, since)));
    return row.value;
  },

  async recordAttempt(identifier: string, ipAddress: string, successful: boolean) {
    await db.insert(loginAttempts).values({ identifier: identifier.toLowerCase(), ipAddress, successful });
  },

  async updateLastLogin(userId: string) {
    await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
  },
};
