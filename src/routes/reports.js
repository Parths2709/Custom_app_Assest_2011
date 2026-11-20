'use strict';

const { Router } = require('express');
const store = require('../store');

const router = Router();

const ALL_FIELDS = [
  'assetId', 'model', 'name', 'serialNumber', 'categoryId', 'subCategoryId',
  'status', 'purchaseDate', 'warrantyDate', 'employeeId', 'allocatedAt', 'createdAt',
];

/**
 * @openapi
 * /reports/assets:
 *   get:
 *     tags: [Reports]
 *     summary: Generate a filtered asset report with custom field selection
 *     parameters:
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to include. Defaults to all fields.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: subCategoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: purchaseDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: purchaseDateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: warrantyDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: warrantyDateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Filtered report rows
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fields:
 *                   type: array
 *                   items:
 *                     type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 */
router.get('/assets', (req, res) => {
  const {
    fields, status, categoryId, subCategoryId, employeeId,
    purchaseDateFrom, purchaseDateTo, warrantyDateFrom, warrantyDateTo,
  } = req.query;

  const selectedFields = fields
    ? fields.split(',').map(f => f.trim()).filter(f => ALL_FIELDS.includes(f))
    : ALL_FIELDS;

  let items = Array.from(store.assets.values());

  if (status) items = items.filter(a => a.status === status);
  if (categoryId) items = items.filter(a => a.categoryId === String(categoryId));
  if (subCategoryId) items = items.filter(a => a.subCategoryId === String(subCategoryId));
  if (employeeId) items = items.filter(a => a.employeeId === String(employeeId));
  if (purchaseDateFrom) items = items.filter(a => a.purchaseDate && a.purchaseDate >= purchaseDateFrom);
  if (purchaseDateTo) items = items.filter(a => a.purchaseDate && a.purchaseDate <= purchaseDateTo);
  if (warrantyDateFrom) items = items.filter(a => a.warrantyDate && a.warrantyDate >= warrantyDateFrom);
  if (warrantyDateTo) items = items.filter(a => a.warrantyDate && a.warrantyDate <= warrantyDateTo);

  const rows = items.map(asset => {
    const row = {};
    for (const f of selectedFields) row[f] = asset[f] ?? null;
    return row;
  });

  res.json({ fields: selectedFields, data: rows, total: rows.length });
});

module.exports = router;
