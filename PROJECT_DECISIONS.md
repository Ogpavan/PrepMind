# Project Decisions

## 2026-07-17: Empty source workspace

The provided workspace contained no source files and was not a Git repository. The application was scaffolded at the workspace root with the requested stack. No useful existing source code was available to preserve.

## 2026-07-17: Empty live application schema

The live PostgreSQL 16.14 database was introspected before changes. It contained no application tables, columns, constraints, enums, relationships, or indexes. The initial migration is therefore an essential MVP addition rather than a duplicate or replacement schema. It contains no destructive statements.

## Auth.js session strategy

Credentials authentication uses signed JWT sessions rather than database session tables. This keeps credential state in `users`, avoids unused adapter tables, and still provides secure HTTP-only cookies, expiry, logout, active status, role checks, and last-login tracking.

## Persistent login throttling

Failed/successful login events are stored in `login_attempts`. The MVP blocks five recent failures for an email/IP pair for 15 minutes. Production deployments with multiple regions may later add edge-level throttling, but the database rule remains a consistent backstop.

## Question content format

MVP question, option, and explanation content is sanitized and stored as plain text. This deliberately avoids unsafe rich HTML and the excluded rich mathematical editor. Line breaks remain visible in the learner UI.

## Stable session snapshots

`study_session_questions.snapshot` stores the prompt, options, correctness, explanation, difficulty, subject name, and topic name at session creation. Learner payloads remove correctness until an attempt exists. This makes session history stable while keeping questions reusable and independently editable.

## Immutable attempts

An attempt is inserted once for each `session_question_id`, enforced by a unique index. Application code does not update or delete attempts. Skips store `is_correct = null` and are excluded from correct/incorrect totals.

## Soft lifecycle instead of deletion

Important content is activated/deactivated or archived/restored. Admin UI does not expose hard deletion for exams, subjects, topics, or questions, so dependency rules cannot be bypassed. Foreign keys use `RESTRICT` for historical and hierarchy references.

## Server-side trust boundary

The server derives user identity and role from Auth.js, validates ownership on every learner session query, validates all mutations with Zod, and calculates correctness itself. Client-provided user IDs, roles, scores, and correctness are never accepted.

## PostgreSQL network exposure

Port 5432 was not opened to the public internet. Schema migration, seed, and integration verification used an SSH tunnel. Production deployment should use a private connection or localhost.

## Seed credentials

Known demonstration credentials are included only to make the MVP immediately testable. They must be changed or removed before public deployment.

## Package resolution

The scaffold resolved Next.js 16.2.10, React 19.2.4, Mantine 9.4.1, Drizzle ORM 0.45.2, Auth.js 5 beta, and Zod 4.4.3 on 2026-07-17. The lockfile is authoritative. Next.js Server Component files use named Mantine compound exports where required to avoid passing undefined static subcomponents across the RSC boundary.

## Horizontal Tabler navigation

The authenticated application uses Tabler's horizontal layout pattern: a compact identity/account bar followed by an icon-led primary navigation bar. On small screens the desktop route bar is replaced by mobile bottom navigation rather than becoming a sidebar. The locally bundled Inter variable font, Tabler Icons, compact four-pixel radii, `#206bc4` primary blue, and Zinc 100 (`#f4f4f5`) page background reproduce the requested visual language without importing Tabler's Bootstrap CSS.

## Mobile-first navigation and study flow

Mobile uses a persistent safe-area-aware bottom navigation instead of the desktop route bar. Student routes expose five direct tabs; admin routes expose four primary tabs and a bottom sheet for secondary destinations. Learner statistics use two columns, and recent sessions switch from a table to touch-friendly progress rows. Single-choice and true/false selections submit immediately and advance after feedback; multiple-choice retains explicit confirmation because several options may be required.
