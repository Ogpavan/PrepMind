# Database Setup

## Requirements

- PostgreSQL 16 or a compatible supported version
- A database and login role with permission to create tables, enums, indexes, constraints, and the Drizzle migration schema
- Node.js 20+ and pnpm through Corepack

## Environment

Copy `.env.example` to `.env` and set:

```dotenv
DATABASE_URL=postgresql://application-user:strong-password@database-host:5432/prepmind
AUTH_SECRET=at-least-32-random-characters
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_NAME=PrepMind
```

Do not commit `.env`; it is ignored. Prefer a non-superuser PostgreSQL role in production with ownership of only the PrepMind schema objects.

## Apply the schema

```powershell
corepack pnpm db:migrate
```

The checked-in migration contains only `CREATE TYPE`, `CREATE TABLE`, `ALTER TABLE ... ADD CONSTRAINT`, and `CREATE INDEX` statements. It does not drop, truncate, rename, or delete existing objects. Drizzle records successful applications so rerunning the command is safe.

## Seed MVP data

```powershell
corepack pnpm db:seed
```

The seed is idempotent. It creates demonstration admin/student identities, a General Aptitude exam, quantitative and verbal subjects/topics, and twelve sample questions only when missing.

## Generate a future additive migration

1. Update `src/infrastructure/database/schema.ts`.
2. Run `corepack pnpm db:generate`.
3. Review the SQL for destructive statements.
4. Move nonessential recommendations to `migrations/pending` instead of applying them.
5. Back up the database and run `corepack pnpm db:migrate`.

## Connectivity

The current database host accepts PostgreSQL locally on the server. Development verification used an SSH local-forward rather than opening port 5432 publicly. A deployed app on the same host should use `127.0.0.1` in `DATABASE_URL`; remote development should use a VPN, SSH tunnel, or another restricted network path.

## Backup

Before production migrations, take a logical backup:

```bash
pg_dump --format=custom --file=prepmind-before-migration.dump prepmind
```

Restore procedures should be tested separately from the production database.
