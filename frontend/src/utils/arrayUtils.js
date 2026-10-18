/**
 * LabSetu Array Safety Utilities
 *
 * Prevents "map / filter is not a function" runtime crashes that occur when
 * API calls return non-array shapes like { success: false } or { error: "…" }.
 *
 * Usage:
 *   import { ensureArray } from '../../utils/arrayUtils';
 *   const safeList = ensureArray(rawApiData);
 *   safeList.map((item) => …);
 */

/**
 * Normalises any value into a guaranteed JavaScript array.
 *
 * Priority:
 *  1. Already an array          → returned as-is
 *  2. Has a `.data` array       → returns `val.data`
 *  3. Has a `.records` array    → returns `val.records`
 *  4. Has a `.results` array    → returns `val.results`
 *  5. Has a `.items` array      → returns `val.items`
 *  6. Anything else (null, obj, undefined) → returns []
 *
 * @param {*} val - Raw value from API / hook state
 * @returns {Array}
 */
export function ensureArray(val) {
  if (Array.isArray(val)) return val;
  if (val && Array.isArray(val.data))    return val.data;
  if (val && Array.isArray(val.records)) return val.records;
  if (val && Array.isArray(val.results)) return val.results;
  if (val && Array.isArray(val.items))   return val.items;
  return [];
}

/**
 * Normalises any value into a guaranteed plain object.
 *
 * @param {*} val - Raw value from API / hook state
 * @param {Object} [defaults={}] - Default object if val is not usable
 * @returns {Object}
 */
export function ensureObject(val, defaults = {}) {
  if (val && typeof val === 'object' && !Array.isArray(val)) return val;
  return defaults;
}

export default ensureArray;
