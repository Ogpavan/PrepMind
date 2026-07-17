# Database Mapping

## Inspection result

The live `prepmind` database was inspected before implementation on 2026-07-17. It runs PostgreSQL 16.14. At inspection time it contained the default `public` schema and `plpgsql` extension, with no application tables, enums, indexes, foreign keys, or data. No existing application object could be reused, so migration `migrations/0000_bright_dazzler.sql` adds the essential MVP structure without destructive statements.

## Enums

| Enum | Values | Module |
| --- | --- | --- |
| `user_role` | `SUPER_ADMIN`, `ADMIN`, `STUDENT` | identity/users |
| `question_type` | `single_choice`, `multiple_choice`, `true_false` | questions/study |
| `difficulty` | `easy`, `medium`, `hard` | questions/study |
| `session_status` | `created`, `in_progress`, `completed`, `abandoned` | study |

## Tables

| Table | Purpose | Main relationships and integrity |
| --- | --- | --- |
| `users` | Credential identities, roles, active state, last login | Case-insensitive unique email; role/active index |
| `login_attempts` | Persistent login throttle evidence | Indexed by identifier, IP, and time |
| `exams` | Exam configuration and scoring targets | Unique case-insensitive code; positive marks/duration checks |
| `subjects` | Ordered subjects owned by an exam | Restrict-delete exam FK; unique exam/name and exam/code |
| `topics` | Topics and optional self-referencing subtopics | Restrict-delete subject/parent FKs; self-parent check; cycles rejected by service |
| `questions` | Reusable question-bank records | Restrict-delete exam/subject/topic FKs; soft archive; filter indexes |
| `question_options` | Ordered answer choices and correctness flags | Cascade only when the owning question is removed; unique question/order |
| `study_sessions` | Learner session state and timer | Restrict-delete user/hierarchy FKs; user/status/time index |
| `study_session_questions` | Immutable ordered session question list and snapshot | Unique session/order and session/question; cascade when session is removed |
| `attempts` | Immutable answer submissions | Unique session-question submission; skipped/correctness checks; aggregation indexes |
| `app_settings` | JSON application defaults | Primary-key setting name and updater FK |

Drizzle also maintains its migration journal in the `drizzle` schema.

## Relationship map

```text
users
  +-- exams / subjects / topics / questions (created_by, updated_by)
  +-- study_sessions
        +-- study_session_questions -- questions
        +-- attempts --------------- questions

exams
  +-- subjects
        +-- topics
              +-- topics (parent_topic_id)
        +-- questions
```

## Timestamp policy

All persisted timestamps use PostgreSQL `timestamp with time zone`. Application code supplies JavaScript `Date` values and database defaults use `now()`. Reporting groups daily activity explicitly at UTC.

## Application ownership

| Application module | Primary tables |
| --- | --- |
| identity/users | `users`, `login_attempts` |
| exams | `exams` |
| subjects | `subjects` |
| topics | `topics` |
| questions | `questions`, `question_options` |
| study | `study_sessions`, `study_session_questions` |
| attempts/progress | `attempts` plus read-only joins to hierarchy/session tables |
| settings | `app_settings` |
