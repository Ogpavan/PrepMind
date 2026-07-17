# PrepMind

PrepMind is a production-oriented MVP for managing an exam question bank and running personal study sessions. Administrators configure exams, subjects, hierarchical topics, users, and validated questions. Learners create focused sessions, submit answers, resume after refresh, review explanations, and track real progress calculated from immutable attempts.

## Technology

- Next.js 16 App Router, React 19, and strict TypeScript
- PostgreSQL 16 with Drizzle ORM and non-destructive SQL migrations
- Auth.js credential authentication with JWT sessions and bcrypt password hashing
- Mantine 9, Mantine Form, Mantine Charts, and Tabler Icons
- Zod 4 validation and Vitest
- Playwright browser workflow tests
- pnpm via Corepack

## Quick start

```powershell
corepack pnpm install
Copy-Item .env.example .env
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

Set a strong `AUTH_SECRET` and a valid `DATABASE_URL` before migrating. The migration is additive and does not rename or delete existing database objects.

## Seeded local accounts

The idempotent MVP seed creates these demonstration accounts:

| Role | Email | Initial password |
| --- | --- | --- |
| Super admin | `admin@prepmind.local` | `Admin@12345` |
| Student | `student@prepmind.local` | `Student@12345` |

Change these passwords before exposing the application outside a controlled environment.

## Core workflows

- Credential login, logout, active-account enforcement, database-backed login throttling, and role-based server authorization
- Exam, subject, topic/subtopic, user, settings, and question management
- Question duplication, archive/restore, bulk archive/activate, searching, filters, sorting, and pagination
- Single-choice, multiple-choice, and true/false validation with transactional option storage
- Persisted study-session creation with a stable randomized question list and snapshot
- Refresh-safe session resume, timed sessions, skip, answer feedback, abandon confirmation, and idempotent completion
- Immutable attempts, server-calculated correctness, session summaries, subject/topic performance, and 30-day activity

## Commands

| Command | Purpose |
| --- | --- |
| `corepack pnpm dev` | Start development server |
| `corepack pnpm build` | Create a production build |
| `corepack pnpm start` | Start the production server |
| `corepack pnpm typecheck` | Run strict TypeScript checking |
| `corepack pnpm lint` | Run ESLint with zero warnings allowed |
| `corepack pnpm test` | Run unit tests and optional integration tests |
| `corepack pnpm e2e` | Run browser workflows (requires a reachable database and installed Chromium) |
| `corepack pnpm e2e:install` | Install the Playwright Chromium browser |
| `corepack pnpm db:generate` | Generate additive Drizzle SQL from schema changes |
| `corepack pnpm db:migrate` | Apply pending migrations |
| `corepack pnpm db:seed` | Idempotently seed MVP users and sample content |

Set `RUN_DB_TESTS=true` with a reachable test database to include the rollback-only PostgreSQL integration suite.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Database mapping](DATABASE_MAPPING.md)
- [Database setup](DATABASE_SETUP.md)
- [Project decisions](PROJECT_DECISIONS.md)

## Security notes

Authorization is enforced in layouts and server actions; hiding UI alone is never treated as authorization. Incoming mutations are validated with Zod. Question content is stored as sanitized plain text. Scores and correctness are calculated on the server. Cookies are managed by Auth.js as HTTP-only session cookies, standard security headers are configured in `next.config.ts`, and failed login attempts are persisted for throttling.
