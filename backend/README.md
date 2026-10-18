# Backend APIs

This Express service implements only the assigned business due reports, imaging and outsource routing, and lab analytics APIs. It uses parameterized PostgreSQL queries. Production access is disabled until the authority JWT and laboratory scope contract is verified. It does not implement billing creation, authentication issuance, image processing, or frontend changes.

## Run

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

The public health endpoint is `GET /api/health`; `databaseConfigured` reports configuration presence, not a successful database connection. Protected endpoints return `503` without JWT configuration or while the claim contract is unverified. Once authentication is enabled, a missing database also returns `503`; query failures return controlled errors without database details. There are no production mock responses. Run the focused synthetic-data tests with `npm test`.

## Endpoints

- `GET /api/business/due-reports` and compatibility alias `GET /api/billing/dues`: optional `caseType`, `patientId`, `from`, `to`, and `asOf` filters. Returns case rows, billed/paid/outstanding totals, and aging totals.
- `GET /api/imaging/cases`, `GET /api/imaging/cases/:id`, `POST /api/imaging/cases`, `PUT /api/imaging/cases/:id`: CT, USG, and digital X-Ray cases (`ct_scan`, `usg`, `digital_xray`).
- `GET /api/outsource/cases`, `GET /api/outsource/cases/:id`, `POST /api/outsource/cases`, `PUT /api/outsource/cases/:id`: outsourced lab routing.
- `GET /api/analytics/tat`, `GET /api/analytics/abnormal-results`, `GET /api/analytics/test-frequency`: optional `from`, `to`, and `caseId` filters.

All module endpoints require `Authorization: Bearer <JWT>`. **The actual Supabase JWT contract is unconfirmed.** The current HS256, audience `authenticated`, role/lab claim mapping is a synthetic test contract only, not a discovered production contract. Tests verify signatures and require an expiry, authority role and non-empty laboratory scope. Every query uses the token's laboratory scope and parameterized values.

`createApp` defaults `authContractVerified` to `false`, and the production launcher never opts in. Setting a secret and database URL therefore cannot enable these APIs. Only synthetic tests explicitly opt in. Before changing that gate, obtain and implement the approved signing algorithm/key source, issuer, audience, expiry policy, trusted role and lab claim paths, lab identifier type, and patient ownership policy. Review that implementation before enabling production access; no environment variable bypass is supplied.

## Database Contract and Status

**Supabase integration is BLOCKED.** `main` contains no database migrations, Supabase project configuration, credentials, backend, or table definitions. The APIs therefore make no claim that these relations or columns already exist. No schema was migrated or independently redesigned. Rishabh must confirm the existing schema, mapping, ownership policy, and required read-only views before the SQL can be enabled against live data.

Required contract for the SQL in this service:

- `v_labsetu_case_balances`: one row per case and laboratory, with `lab_id`, `case_id`, `patient_id`, `patient_name`, `case_type`, `case_created_at`, `due_at`, `billed_amount`, and `paid_amount`. The view must derive billed and paid totals from the approved bill/payment records. The API computes `max(billed_amount - paid_amount, 0)` in PostgreSQL.
- Planned `imaging_cases`: `id`, `lab_id`, `patient_id`, `case_type`, `status`, `accession_number`, `referred_by`, `notes`, `created_at`, and `updated_at`.
- Planned `outsource_cases`: `id`, `lab_id`, `patient_id`, `test_name`, `partner_lab_name`, `status`, `routed_at`, `created_at`, and `updated_at`.
- `v_labsetu_test_results`: one row per test with `lab_id`, `case_id`, `test_id`, `test_name`, `ordered_at`, `completed_at`, `status`, and nullable boolean `is_abnormal`.

IDs used as `patient_id`, `case_id`, and `test_id` must be PostgreSQL UUIDs; timestamps must be `timestamptz` or consistently interpreted PostgreSQL timestamps; money columns must be `numeric`. Relation names, ownership constraints, enum values, and column types above are required API contracts only, not discovered schema. They need Rishabh's approval/mapping to actual records. Imaging and outsource creation must also be covered by an approved database ownership constraint or verified patient ownership check; the service cannot infer that relationship without the schema.

Analytics definitions: TAT is elapsed seconds from `ordered_at` to `completed_at` for `status = 'completed'` with non-negative duration; the response reports mean and median. Abnormal rate is abnormal completed results divided by completed results with a known abnormal flag. Frequency counts all non-cancelled test rows. Date filters apply to `ordered_at` and are inclusive. Empty aggregates return zero counts and numeric strings; empty listings return arrays. Money and decimal analytics values remain strings to preserve PostgreSQL precision.

Date-only filters and the default `asOf` use UTC calendar days; the production PostgreSQL pool sets its session timezone to UTC. Year zero and invalid calendar dates are rejected. Rishabh must confirm timestamp column types and the interpretation of any timestamps without timezone before live integration. Business billed/paid/outstanding totals cover only cases with a positive outstanding balance; overpayments are clamped to zero outstanding.

The requested aging intervals overlap on day 60. To avoid double counting, this API assigns ages `0-7`, `8-30`, `31-59`, and `60+`; day 60 belongs only to `60+`. Aging is measured from `due_at` at `asOf`; future due dates are clamped to age zero.

## Verification Limits

The tests use synthetic query results to cover route behavior, filters, validation, access scope, and response aggregates. SQL expressions and boundary predicates are reviewed and checked, but these tests do not execute PostgreSQL arithmetic or prove live schema compatibility, database ownership constraints, or Supabase JWT integration. Those remain blocked until the database owner confirms the contracts above and provides a controlled integration environment. This implementation is not production-ready and should be reviewed as a draft.
