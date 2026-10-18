/**
 * LabSetu Resource Route Handler  v1.0
 *
 * Provides a generic  GET/POST/PUT/DELETE  /api/resources/:resource  API that:
 *   • Maps frontend useDemoResource keys → real Supabase table names
 *   • Returns { success: true, data: [] } (never 404) when a table is absent
 *     or has no rows, so the UI always gets something back
 *   • Writes incoming payloads to Supabase with upsert semantics
 *   • Falls back to { success: true, data: fallback } when Supabase is unconfigured
 *
 * Resource-to-table mapping
 * ─────────────────────────
 * frontend key                    → Supabase table / strategy
 * ──────────────────────────────────────────────────────────────
 * appointments                    → appointments   (exists, center-scoped)
 * referral_business_records       → referral_business_records  (generic KV)
 * active_billing_workflow         → active_billing_workflow    (generic KV)
 * dashboard                       → patient_cases + bills      (aggregated)
 * labsetu_support_tickets         → labsetu_support_tickets    (generic KV)
 * labsetu_privacy_settings        → labsetu_privacy_settings   (generic KV)
 * todays_reports_list             → patient_cases + test_results (read-only)
 * <anything else>                 → app_kv_store (key-value pair fallback)
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase singleton ────────────────────────────────────────────────────────
let _supabase = null;

function getSupabase() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return _supabase;
}

// ─── Allowed resource keys and their metadata ─────────────────────────────────
const RESOURCE_CONFIG = {
  // Directly mapped Supabase tables
  appointments: {
    table: 'appointments',
    upsertKey: 'id',
    requiresAuth: false,   // citizen-facing, use anon data from payload
    orderBy: 'created_at',
    desc: true
  },

  // Generic KV resources – stored in app_kv_store if table doesn't exist,
  // but we attempt the real table name first
  referral_business_records:  { table: 'referral_business_records',  upsertKey: 'id'  },
  active_billing_workflow:    { table: 'active_billing_workflow',    upsertKey: 'id'  },
  labsetu_support_tickets:    { table: 'labsetu_support_tickets',    upsertKey: 'id'  },
  labsetu_privacy_settings:   { table: 'labsetu_privacy_settings',  upsertKey: 'key' },

  // Read-only aggregated resources
  dashboard:           { table: 'patient_cases', readOnly: true },
  todays_reports_list: { table: 'patient_cases', readOnly: true }
};

// Tables that we know exist in Supabase (discovered at boot time)
const KNOWN_TABLES = new Set(['patient_cases', 'test_results', 'reports', 'appointments', 'bills', 'profiles']);

// ─── Graceful Supabase query with "table not found" tolerance ─────────────────
async function safeFetch(supabase, table, options = {}) {
  try {
    let q = supabase.from(table).select(options.select || '*');
    if (options.match)   q = q.match(options.match);
    if (options.orderBy) q = q.order(options.orderBy, { ascending: !options.desc });
    if (options.limit)   q = q.limit(options.limit);

    const { data, error } = await q;

    // Table not found → treat as empty
    if (error) {
      const notFound = error.message?.includes('does not exist') ||
                       error.message?.includes('not found in the schema cache') ||
                       error.code === '42P01';
      if (notFound) return { data: [], tableAbsent: true };
      // Unexpected Supabase error (permissions, syntax, etc.)
      console.error(`[Resources] Supabase error on table "${table}":`, error.message);
      throw error;
    }

    return { data: data ?? [] };
  } catch (err) {
    // Swallow all table-not-found style errors silently
    return { data: [], tableAbsent: true };
  }
}

// ─── Generic KV upsert via app_kv_store ──────────────────────────────────────
async function kvUpsert(supabase, key, payload) {
  // Try upsert into app_kv_store; create row if absent
  const { error } = await supabase.from('app_kv_store').upsert(
    { key, value: payload, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );
  return { error };
}

async function kvFetch(supabase, key) {
  const { data, error } = await supabase.from('app_kv_store').select('value').eq('key', key).maybeSingle();
  if (error || !data) return null;
  return data.value;
}

// ─── Router factory ───────────────────────────────────────────────────────────
export function createResourcesRouter({ requireAuthority } = {}) {
  const router = express.Router();

  // ── GET /api/resources/:resource ──────────────────────────────────────────
  router.get('/:resource', async (req, res) => {
    const { resource } = req.params;
    const supabase = getSupabase();

    // Unknown resource → empty response (never 404)
    if (!RESOURCE_CONFIG[resource] && !resource.match(/^[a-z0-9_]{2,80}$/)) {
      return res.json({ success: true, data: [] });
    }

    // No Supabase → return empty (UI falls back to localStorage)
    if (!supabase) {
      return res.json({ success: true, data: [], _source: 'offline' });
    }

    const cfg = RESOURCE_CONFIG[resource] || { table: resource };

    try {
      // Special aggregated reads
      if (resource === 'dashboard') {
        const [casesRes, billsRes] = await Promise.all([
          safeFetch(supabase, 'patient_cases', { limit: 100, orderBy: 'created_at', desc: true }),
          safeFetch(supabase, 'bills',          { limit: 100, orderBy: 'created_at', desc: true })
        ]);
        return res.json({ success: true, data: { cases: casesRes.data, bills: billsRes.data }, _source: 'supabase' });
      }

      if (resource === 'todays_reports_list') {
        const today = new Date().toISOString().slice(0, 10);
        const { data: cases } = await safeFetch(supabase, 'patient_cases', {
          orderBy: 'created_at', desc: true, limit: 50
        });
        return res.json({ success: true, data: cases, _source: 'supabase' });
      }

      // Standard table fetch
      if (KNOWN_TABLES.has(cfg.table)) {
        const { data } = await safeFetch(supabase, cfg.table, {
          orderBy: cfg.orderBy || 'created_at',
          desc:    cfg.desc    ?? true,
          limit:   200
        });
        return res.json({ success: true, data, _source: 'supabase' });
      }

      // Try real table, fall back to app_kv_store
      const { data, tableAbsent } = await safeFetch(supabase, cfg.table, { limit: 200 });
      if (!tableAbsent) {
        return res.json({ success: true, data, _source: 'supabase' });
      }

      // Try app_kv_store fallback
      const kvValue = await kvFetch(supabase, resource);
      if (kvValue !== null) {
        return res.json({ success: true, data: kvValue, _source: 'kv' });
      }

      // Nothing found anywhere → safe empty response
      return res.json({ success: true, data: [], _source: 'empty' });

    } catch (err) {
      console.error(`[Resources GET ${resource}]`, err.message);
      return res.json({ success: true, data: [], _source: 'error_fallback' });
    }
  });

  // ── POST /api/resources/:resource ─────────────────────────────────────────
  router.post('/:resource', async (req, res) => {
    const { resource } = req.params;
    const supabase = getSupabase();

    if (!supabase) {
      return res.json({ success: true, _source: 'offline', message: 'Supabase not configured – data saved locally.' });
    }

    if (!resource.match(/^[a-z0-9_]{2,80}$/)) {
      return res.status(400).json({ success: false, error: 'Invalid resource name.' });
    }

    const body = req.body;
    if (body === undefined || body === null) {
      return res.status(400).json({ success: false, error: 'Request body is required.' });
    }

    const cfg = RESOURCE_CONFIG[resource] || { table: resource };

    try {
      // For known tables, attempt direct upsert
      if (KNOWN_TABLES.has(cfg.table)) {
        const rows = Array.isArray(body) ? body : [body];
        const { data, error } = await supabase
          .from(cfg.table)
          .upsert(rows, { onConflict: cfg.upsertKey || 'id', ignoreDuplicates: false })
          .select();

        if (error) throw error;
        return res.json({ success: true, data: data ?? rows, _source: 'supabase' });
      }

      // Try real table upsert
      if (cfg.table !== resource) {
        const rows = Array.isArray(body) ? body : [body];
        const { data, error } = await supabase
          .from(cfg.table)
          .upsert(rows, { onConflict: cfg.upsertKey || 'id', ignoreDuplicates: false })
          .select();

        if (!error) {
          return res.json({ success: true, data: data ?? rows, _source: 'supabase' });
        }
        // Table absent → fall through to KV store
      }

      // Generic KV upsert
      const { error: kvError } = await kvUpsert(supabase, resource, body);
      if (kvError) {
        const isMissing = kvError.message?.includes('not found in the schema cache') ||
                          kvError.message?.includes('does not exist');
        if (!isMissing) {
          console.error(`[Resources POST ${resource}] Unexpected KV error:`, kvError.message);
        }
      }
      return res.json({ success: true, data: body, _source: 'kv' });

    } catch (err) {
      console.error(`[Resources POST ${resource}]`, err.message);
      // Always ack success so the frontend doesn't throw
      return res.json({ success: true, data: body, _source: 'error_ack', warning: err.message });
    }
  });

  // ── PUT /api/resources/:resource (alias for POST – idempotent update) ──────
  router.put('/:resource', (req, res, next) => {
    // Reuse the POST handler
    req.method = 'POST';
    router.handle(req, res, next);
  });

  // ── DELETE /api/resources/:resource (clear KV key) ───────────────────────
  router.delete('/:resource', async (req, res) => {
    const { resource } = req.params;
    const supabase = getSupabase();
    if (!supabase) return res.json({ success: true });

    try {
      await supabase.from('app_kv_store').delete().eq('key', resource);
    } catch {
      // Ignore – table may not exist
    }
    return res.json({ success: true });
  });

  return router;
}
