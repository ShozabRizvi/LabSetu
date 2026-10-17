# Backend verification - 17 October 2026

## COMPLETE: implementation and local checks

- Resumed the existing `LabSetu-intact` checkout at base commit `e55742656098279d6db25c2e3eb51918048799d1`, preserving its 12 staged backend files. The user renamed the intended working branch to `feat/prashasti-backend`.
- Scope is business due reports, CT/USG/Digital X-Ray imaging, outsource cases, and lab analytics only. No frontend source, Asmit branch changes, appointments, dashboards, deployment configuration, or production database tables were added.
- `npm.cmd test` in `backend`: **39 passed, 0 failed** (original 7 plus 32 focused regression tests).
- `node --check` passed for `server.js` and every file in `src`.
- Backend `npm.cmd audit --json`: **0 vulnerabilities** at verification time.
- Frontend `npm.cmd run build`: passed. `npm.cmd run lint`: completed with the existing four unused-variable warnings (`StarIcon`, `caseTypesLeft`, `caseTypesRight`, `MagnifyingGlassIcon`). No tracked frontend changes.
- Frontend `npm.cmd audit --json`: **1 high-severity advisory**, exit code 1, for `source-map-js`, [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). This unrelated dependency issue is left for the frontend owner.
- Port 5127 had no listening process during inspection; none was stopped. Tests used temporary ports and closed their servers.

Verification fixed genuine defects: missing `/api/billing/dues` compatibility alias; imaging PUT checking SQL column names instead of submitted values; blank enum filters bypassing validation; PostgreSQL-invalid year-zero dates; acceptance of JWTs without expiry; and enabling an unconfirmed JWT claim contract merely by configuring credentials. The production PostgreSQL pool now uses UTC date boundaries.

## COMPLETE: synthetic security and error checks

- Real signature verification rejects forged, unsigned, wrong-algorithm, wrong-audience, expired and expiry-free tokens under the explicitly synthetic test contract.
- Missing credentials, missing/invalid lab scope and non-authority roles are rejected before queries. Request lab fields cannot override the signed lab scope.
- Production defaults to `authContractVerified: false`. The launcher never opts in, even with a secret and database URL. Missing authentication configuration or an unverified contract returns a controlled `503` without querying the database.
- With the synthetic test authentication enabled, missing database configuration returns `503`; query failures return sanitized errors rather than fabricated records or private database details.
- SQL binds request values as parameters; update identifiers come from a fixed whitelist. Read/update queries include the token lab scope.
- `.env.example` contains local non-secret defaults and empty credential placeholders only. Synthetic credentials and query fixtures live in tests. No live credentials, `.env`, caches, virtual environments or dependency directories are intended for the commit.

## PARTIALLY VERIFIED: calculations and responses

- SQL review and contract checks cover outstanding balances clamped at zero, due-only totals, case-wise rows, mean/median TAT, completed results with known abnormal flags, and non-cancelled test frequency.
- Aging intervals are **0-7, 8-30, 31-59, 60+**. The original 31-60 / 60+ intervals overlap; day 60 belongs only to 60+ to prevent double counting.
- Route tests cover filters, calendar dates, parameterization, laboratory scope, all imaging types, outsource routing, response shapes, empty results, missing records and controlled errors.
- These tests return synthetic database rows. They do **not** execute PostgreSQL arithmetic, establish live Supabase connectivity, verify database constraints, or validate the real Supabase JWT contract.

## BLOCKED: live integration and production readiness

Rishabh must provide or confirm:

1. The actual schema/migrations or approved mappings for `v_labsetu_case_balances`, `imaging_cases`, `outsource_cases` and `v_labsetu_test_results`, including columns, types, enum values, ID/default generation, nullability and source billing/payment semantics. The detailed required contracts are preserved in `README.md`; they are not discovered tables or migrations.
2. A controlled database access configuration: connection details, required TLS/CA settings, securely supplied credentials, service-role privileges and a safe integration test environment.
3. Database lab/patient ownership constraints, access policies and an approved check preventing cross-lab patient references during case creation.
4. Timestamp types, UTC session/date policy, and the interpretation of timestamps stored without timezone.
5. The verified Supabase JWT signing algorithm and key/JWKS source, issuer, audience, expiry policy, trusted role/lab claim paths and laboratory identifier type. No production claim contract has been invented.

After those inputs arrive, implement the confirmed mappings and ownership enforcement, run real database calculation/integration checks, and obtain review before changing the authentication gate. **The APIs are not production-ready.**

Shozab should review the limited backend scope, day-60 aging decision, API/schema contracts, authentication gate and patient ownership dependency. Frontend warnings and the dependency advisory require separate owner review. The pull request must remain **DRAFT** while integration is blocked, and must not be merged as part of this task.
