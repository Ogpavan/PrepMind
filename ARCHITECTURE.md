# Architecture

## Shape

PrepMind is a modular monolith built with the Next.js App Router. The browser, server-rendered pages, server actions, application services, repositories, and PostgreSQL database remain in one deployable unit, while module boundaries keep business behavior replaceable.

```text
Browser
  -> App Router pages and client presentation components
  -> Server actions / route handlers
  -> Module application services
  -> Module infrastructure repositories
  -> Drizzle ORM
  -> PostgreSQL
```

UI components never open database connections. Server actions authenticate and authorize the caller, then invoke application services. Services validate cross-entity rules and call repositories. Only repositories and database lifecycle scripts import the Drizzle client.

## Source layout

```text
src/
  app/                 routes, layouts, loading/error boundaries
  config/              validated environment configuration
  infrastructure/      shared PostgreSQL client and schema
  modules/
    identity/           authentication, authorization, permission rules
    users/              user administration and account settings
    exams/              exam lifecycle
    subjects/           exam-owned subjects
    topics/             topic hierarchy and cycle prevention
    questions/          question validation, options, archive/restore
    study/              session selection and state transitions
    attempts/           immutable results and session summaries
    progress/           database aggregations and dashboards
    settings/           application defaults
  shared/               reusable UI, errors, pagination, text utilities
```

Each business module uses the relevant subset of `domain`, `application`, `infrastructure`, `presentation`, `schemas`, and `types`. Repository interfaces are exposed through module services rather than queried by pages.

## Authentication and authorization

Auth.js uses the credentials provider and JWT sessions. Passwords use bcrypt with cost 12. The database stores user status, role, last-login time, and login attempts. Five failed attempts from the same email/IP pair within 15 minutes cause temporary rejection.

Protected layouts enforce the broad route role. Every mutating server action repeats authorization before calling a service. The roles are:

- `SUPER_ADMIN`: full access, including administrative-role assignment and application settings
- `ADMIN`: question-bank administration and learner visibility
- `STUDENT`: learner dashboard, study, summaries, progress, and account settings

## Study transaction model

1. The server validates active exam hierarchy and requested filters.
2. A transaction selects unique active questions and persists the session.
3. The transaction stores ordered `study_session_questions` with a JSON snapshot.
4. The learner receives options without correctness flags.
5. Each answer is validated against the stored snapshot and inserted once into `attempts`.
6. Correctness is calculated server-side by set equality.
7. Completion locks the session, verifies every question has an attempt, and changes state once.
8. Timed expiry inserts skipped attempts for remaining questions before completion.

Attempts are not updated or deleted by application workflows. Session snapshots keep historical wording and answers stable even when the reusable question bank changes later.

## Error handling

Typed `ApplicationError` values distinguish validation, conflict, missing, unauthorized, and forbidden cases. Server actions convert expected failures into safe messages and field errors. Unexpected errors are logged server-side and converted to a generic response. Database transactions roll back automatically on failure.

## Performance

- React Server Components are the default.
- Interactive forms, filters, charts, and session controls are client components.
- Lists use database pagination and URL-synchronized filters.
- Dashboard/progress metrics use grouped database queries.
- Session questions and attempts are loaded in bounded set queries rather than per-row queries.
- Foreign-key, filter, session, and attempt aggregation indexes are included in the initial migration.
