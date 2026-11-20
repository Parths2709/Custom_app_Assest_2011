'use strict';

const { Router } = require('express');
const createError = require('http-errors');
const store = require('../store');
const { generateAssetIds } = require('../utils/assetId');

const router = Router();

const VALID_STATUSES = ['New', 'Instock', 'Ready', 'Check-In', 'Check-Out', 'Repair', 'Ready after Repair', 'Disposal'];

function recordHistory(assetId, action, fromStatus, toStatus, employeeId, notes) {
  store.activityHistory.push({
    id: store.nextId(),
    assetId,
    action,
    fromStatus: fromStatus || null,
    toStatus: toStatus || null,
    employeeId: employeeId || null,
    notes: notes || null,
    timestamp: new Date().toISOString(),
  });
}

// ─── Generate Asset IDs ───────────────────────────────────────────────────────

/**
 * @openapi
 * /assets/generate-ids:
 *   post:
 *     tags: [Assets]
 *     summary: Generate one or more unique Asset IDs
 *     description: >
 *       Generates immutable Asset IDs in the format {CAT}-{SUBCAT}-{NNN} based on
 *       the selected category, sub-category, and quantity. IDs are reserved immediately.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, subCategoryId, count]
 *             properties:
 *               categoryId:
 *                 type: string
 *               subCategoryId:
 *                 type: string
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Generated Asset IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     assetIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["HW-LPT-001", "HW-LPT-002"]
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/generate-ids', (req, res, next) => {
  const { categoryId, subCategoryId, count } = req.body;
  if (!categoryId || !subCategoryId || !count) {
    return next(createError(400, 'categoryId, subCategoryId, and count are required'));
  }
  const category = store.categories.get(String(categoryId));
  if (!category) return next(createError(404, 'Category not found'));
  const subCategory = store.subCategories.get(String(subCategoryId));
  if (!subCategory) return next(createError(404, 'Sub-category not found'));
  if (subCategory.categoryId !== String(categoryId)) {
    return next(createError(400, 'Sub-category does not belong to the given category'));
  }
  const qty = parseInt(count, 10);
  if (!qty || qty < 1 || qty > 100) return next(createError(400, 'count must be between 1 and 100'));

  const assetIds = generateAssetIds(category.code, subCategory.code, qty);

  // Reserve placeholder records
  const now = new Date().toISOString();
  for (const assetId of assetIds) {
    store.assets.set(assetId, {
      assetId,
      categoryId: String(categoryId),
      subCategoryId: String(subCategoryId),
      model: null,
      name: null,
      serialNumber: null,
      purchaseDate: null,
      warrantyDate: null,
      status: 'New',
      employeeId: null,
      allocatedAt: null,
      specValues: {},
      createdAt: now,
      updatedAt: now,
    });
    recordHistory(assetId, 'created', null, 'New', null, 'Asset ID reserved');
  }

  res.json({ data: { assetIds } });
});

// ─── List / Search Assets ─────────────────────────────────────────────────────

/**
 * @openapi
 * /assets:
 *   get:
 *     tags: [Assets]
 *     summary: List assets with optional search and filter
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by assetId, name, serialNumber, or employeeId
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by asset status
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
 *     responses:
 *       200:
 *         description: List of assets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Asset'
 *                 total:
 *                   type: integer
 */
router.get('/', (req, res) => {
  const { search, status, categoryId, subCategoryId, employeeId } = req.query;
  let items = Array.from(store.assets.values());

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(a =>
      (a.assetId && a.assetId.toLowerCase().includes(q)) ||
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
      (a.employeeId && a.employeeId.toLowerCase().includes(q))
    );
  }
  if (status) items = items.filter(a => a.status === status);
  if (categoryId) items = items.filter(a => a.categoryId === String(categoryId));
  if (subCategoryId) items = items.filter(a => a.subCategoryId === String(subCategoryId));
  if (employeeId) items = items.filter(a => a.employeeId === String(employeeId));

  res.json({ data: items, total: items.length });
});

// ─── Get one Asset ────────────────────────────────────────────────────────────

/**
 * @openapi
 * /assets/{assetId}:
 *   get:
 *     tags: [Assets]
 *     summary: Get asset details with activity history
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Asset detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AssetDetail'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:assetId', (req, res, next) => {
  const asset = store.assets.get(req.params.assetId);
  if (!asset) return next(createError(404, 'Asset not found'));
  const history = store.activityHistory.filter(h => h.assetId === req.params.assetId);
  const employee = asset.employeeId ? store.employees.get(asset.employeeId) : null;
  res.json({ data: { ...asset, history, employee } });
});

// ─── Update Asset Details ─────────────────────────────────────────────────────

/**
 * @openapi
 * /assets/{assetId}:
 *   put:
 *     tags: [Assets]
 *     summary: Update asset details (assetId is immutable)
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssetInput'
 *     responses:
 *       200:
 *         description: Updated asset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:assetId', (req, res, next) => {
  const asset = store.assets.get(req.params.assetId);
  if (!asset) return next(createError(404, 'Asset not found'));

  const { model, name, serialNumber, purchaseDate, warrantyDate, specValues } = req.body;
  if (model !== undefined) asset.model = model;
  if (name !== undefined) asset.name = name;
  if (serialNumber !== undefined) asset.serialNumber = serialNumber;
  if (purchaseDate !== undefined) asset.purchaseDate = purchaseDate;
  if (warrantyDate !== undefined) asset.warrantyDate = warrantyDate;
  if (specValues && typeof specValues === 'object') asset.specValues = { ...asset.specValues, ...specValues };
  asset.updatedAt = new Date().toISOString();

  recordHistory(asset.assetId, 'details_updated', null, null, null, 'Asset details updated');
  res.json({ data: asset });
});

// ─── Update Asset Status ──────────────────────────────────────────────────────

/**
 * @openapi
 * /assets/{assetId}/status:
 *   patch:
 *     tags: [Assets]
 *     summary: Update asset status
 *     description: >
 *       Setting status to "Repair" automatically creates a job card.
 *       Setting status to "Disposal" unallocates the asset.
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [New, Instock, Ready, Check-In, Check-Out, Repair, Ready after Repair, Disposal]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated asset with new status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *                 jobCard:
 *                   $ref: '#/components/schemas/JobCard'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:assetId/status', (req, res, next) => {
  const asset = store.assets.get(req.params.assetId);
  if (!asset) return next(createError(404, 'Asset not found'));

  const { status, notes } = req.body;
  if (!status) return next(createError(400, 'status is required'));
  if (!VALID_STATUSES.includes(status)) {
    return next(createError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`));
  }

  const fromStatus = asset.status;
  asset.status = status;
  asset.updatedAt = new Date().toISOString();

  if (status === 'Disposal') {
    asset.employeeId = null;
    asset.allocatedAt = null;
  }

  recordHistory(asset.assetId, 'status_changed', fromStatus, status, asset.employeeId, notes || null);

  let jobCard = null;
  if (status === 'Repair') {
    const jcId = store.nextId();
    const now = new Date().toISOString();
    jobCard = {
      id: jcId,
      assetId: asset.assetId,
      vendorName: null,
      vendorContact: null,
      issueDescription: notes || null,
      status: 'open',
      vendorSignedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    store.jobCards.set(jcId, jobCard);
  }

  const payload = { data: asset };
  if (jobCard) payload.jobCard = jobCard;
  res.json(payload);
});

// ─── Allocate Asset to Employee ───────────────────────────────────────────────

/**
 * @openapi
 * /assets/{assetId}/allocate:
 *   post:
 *     tags: [Assets]
 *     summary: Allocate an asset to an employee
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId]
 *             properties:
 *               employeeId:
 *                 type: string
 *               confirmationNote:
 *                 type: string
 *                 description: Digital acknowledgment or signature reference
 *     responses:
 *       200:
 *         description: Asset allocated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:assetId/allocate', (req, res, next) => {
  const asset = store.assets.get(req.params.assetId);
  if (!asset) return next(createError(404, 'Asset not found'));

  const { employeeId, confirmationNote } = req.body;
  if (!employeeId) return next(createError(400, 'employeeId is required'));
  if (!store.employees.has(String(employeeId))) return next(createError(404, 'Employee not found'));

  const fromStatus = asset.status;
  asset.employeeId = String(employeeId);
  asset.allocatedAt = new Date().toISOString();
  asset.status = 'Check-In';
  asset.updatedAt = asset.allocatedAt;

  recordHistory(asset.assetId, 'allocated', fromStatus, 'Check-In', String(employeeId), confirmationNote || null);
  res.json({ data: asset });
});

/**
 * @openapi
 * /assets/{assetId}/deallocate:
 *   post:
 *     tags: [Assets]
 *     summary: Remove asset allocation from employee
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Asset deallocated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:assetId/deallocate', (req, res, next) => {
  const asset = store.assets.get(req.params.assetId);
  if (!asset) return next(createError(404, 'Asset not found'));

  const fromStatus = asset.status;
  const prevEmployee = asset.employeeId;
  asset.employeeId = null;
  asset.allocatedAt = null;
  asset.status = 'Check-Out';
  asset.updatedAt = new Date().toISOString();

  recordHistory(asset.assetId, 'deallocated', fromStatus, 'Check-Out', prevEmployee, null);
  res.json({ data: asset });
});

// ─── Activity History ─────────────────────────────────────────────────────────

/**
 * @openapi
 * /assets/{assetId}/history:
 *   get:
 *     tags: [Assets]
 *     summary: Get activity history for an asset
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivityHistory'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:assetId/history', (req, res, next) => {
  if (!store.assets.has(req.params.assetId)) return next(createError(404, 'Asset not found'));
  const history = store.activityHistory.filter(h => h.assetId === req.params.assetId);
  res.json({ data: history });
});

module.exports = router;
