'use strict';

const { assetCounters } = require('../store');

/**
 * Generates one or more immutable Asset IDs in the form {CAT}-{SUBCAT}-{NNN}.
 * The counter per (category, subCategory) pair persists for the lifetime of the process.
 */
function generateAssetIds(categoryCode, subCategoryCode, count) {
  const key = `${categoryCode}-${subCategoryCode}`;
  const current = assetCounters.get(key) || 0;
  const ids = [];
  for (let i = 1; i <= count; i++) {
    const seq = current + i;
    ids.push(`${categoryCode}-${subCategoryCode}-${String(seq).padStart(3, '0')}`);
  }
  assetCounters.set(key, current + count);
  return ids;
}

module.exports = { generateAssetIds };
