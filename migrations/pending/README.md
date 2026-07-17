# Pending schema recommendations

No unapplied schema change is required for the MVP.

Reassess these additive optimizations only after production query evidence justifies them:

- Enable `pg_trgm` and add GIN trigram indexes for large question-bank text search.
- Add partial indexes tailored to the most common active-question filter combinations.
- Introduce a retention/partitioning policy for `login_attempts` after operational volume is known.

These are intentionally not part of the applied migration because the current dataset and MVP workload do not justify the added extension and maintenance cost.
