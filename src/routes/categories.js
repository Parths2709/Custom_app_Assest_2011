'use strict';

const { Router } = require('express');
const createError = require('http-errors');
const store = require('../store');

const router = Router();

// ─── Categories ──────────────────────────────────────────────────────────────

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories
 *     responses:
 *       200:
 *         description: Array of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/', (_req, res) => {
  res.json({ data: Array.from(store.categories.values()) });
});

/**
 * @openapi
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Created category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', (req, res, next) => {
  const { name, code } = req.body;
  if (!name || !code) return next(createError(400, 'name and code are required'));

  const upperCode = String(code).toUpperCase().replace(/\s+/g, '');
  for (const c of store.categories.values()) {
    if (c.code === upperCode) return next(createError(409, `Category code '${upperCode}' already exists`));
  }

  const id = store.nextId();
  const now = new Date().toISOString();
  const category = { id, code: upperCode, name, createdAt: now, updatedAt: now };
  store.categories.set(id, category);
  res.status(201).json({ data: category });
});

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category with its sub-categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CategoryDetail'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', (req, res, next) => {
  const category = store.categories.get(req.params.id);
  if (!category) return next(createError(404, 'Category not found'));
  const subs = Array.from(store.subCategories.values()).filter(s => s.categoryId === req.params.id);
  res.json({ data: { ...category, subCategories: subs } });
});

/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Updated category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', (req, res, next) => {
  const category = store.categories.get(req.params.id);
  if (!category) return next(createError(404, 'Category not found'));
  const { name, code } = req.body;
  if (name) category.name = name;
  if (code) category.code = String(code).toUpperCase().replace(/\s+/g, '');
  category.updatedAt = new Date().toISOString();
  res.json({ data: category });
});

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', (req, res, next) => {
  if (!store.categories.has(req.params.id)) return next(createError(404, 'Category not found'));
  store.categories.delete(req.params.id);
  res.status(204).end();
});

// ─── Sub-categories ───────────────────────────────────────────────────────────

/**
 * @openapi
 * /categories/{id}/subcategories:
 *   get:
 *     tags: [Categories]
 *     summary: List sub-categories of a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of sub-categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubCategory'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/subcategories', (req, res, next) => {
  if (!store.categories.has(req.params.id)) return next(createError(404, 'Category not found'));
  const subs = Array.from(store.subCategories.values()).filter(s => s.categoryId === req.params.id);
  res.json({ data: subs });
});

/**
 * @openapi
 * /categories/{id}/subcategories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a sub-category under a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubCategoryInput'
 *     responses:
 *       201:
 *         description: Created sub-category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/SubCategory'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/subcategories', (req, res, next) => {
  if (!store.categories.has(req.params.id)) return next(createError(404, 'Category not found'));
  const { name, code } = req.body;
  if (!name || !code) return next(createError(400, 'name and code are required'));
  const upperCode = String(code).toUpperCase().replace(/\s+/g, '');
  const id = store.nextId();
  const now = new Date().toISOString();
  const sub = { id, categoryId: req.params.id, code: upperCode, name, createdAt: now, updatedAt: now };
  store.subCategories.set(id, sub);
  res.status(201).json({ data: sub });
});

/**
 * @openapi
 * /subcategories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a sub-category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sub-category with its specifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/SubCategoryDetail'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/subcategories/:subId', (req, res, next) => {
  const sub = store.subCategories.get(req.params.subId);
  if (!sub) return next(createError(404, 'Sub-category not found'));
  const specs = Array.from(store.specifications.values()).filter(s => s.subCategoryId === req.params.subId);
  res.json({ data: { ...sub, specifications: specs } });
});

/**
 * @openapi
 * /subcategories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update a sub-category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubCategoryInput'
 *     responses:
 *       200:
 *         description: Updated sub-category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/SubCategory'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/subcategories/:subId', (req, res, next) => {
  const sub = store.subCategories.get(req.params.subId);
  if (!sub) return next(createError(404, 'Sub-category not found'));
  const { name, code } = req.body;
  if (name) sub.name = name;
  if (code) sub.code = String(code).toUpperCase().replace(/\s+/g, '');
  sub.updatedAt = new Date().toISOString();
  res.json({ data: sub });
});

/**
 * @openapi
 * /subcategories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a sub-category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/subcategories/:subId', (req, res, next) => {
  if (!store.subCategories.has(req.params.subId)) return next(createError(404, 'Sub-category not found'));
  store.subCategories.delete(req.params.subId);
  res.status(204).end();
});

// ─── Specifications ───────────────────────────────────────────────────────────

/**
 * @openapi
 * /specifications:
 *   post:
 *     tags: [Categories]
 *     summary: Create a specification linked to a category or sub-category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SpecificationInput'
 *     responses:
 *       201:
 *         description: Created specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Specification'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/specifications', (req, res, next) => {
  const { name, type, required, categoryId, subCategoryId } = req.body;
  if (!name) return next(createError(400, 'name is required'));
  if (!categoryId && !subCategoryId) return next(createError(400, 'categoryId or subCategoryId is required'));
  const id = store.nextId();
  const now = new Date().toISOString();
  const spec = {
    id,
    name,
    type: type || 'text',
    required: Boolean(required),
    categoryId: categoryId || null,
    subCategoryId: subCategoryId || null,
    createdAt: now,
    updatedAt: now,
  };
  store.specifications.set(id, spec);
  res.status(201).json({ data: spec });
});

/**
 * @openapi
 * /specifications/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update a specification
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SpecificationInput'
 *     responses:
 *       200:
 *         description: Updated specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Specification'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/specifications/:specId', (req, res, next) => {
  const spec = store.specifications.get(req.params.specId);
  if (!spec) return next(createError(404, 'Specification not found'));
  const { name, type, required } = req.body;
  if (name) spec.name = name;
  if (type) spec.type = type;
  if (required !== undefined) spec.required = Boolean(required);
  spec.updatedAt = new Date().toISOString();
  res.json({ data: spec });
});

/**
 * @openapi
 * /specifications/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a specification
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/specifications/:specId', (req, res, next) => {
  if (!store.specifications.has(req.params.specId)) return next(createError(404, 'Specification not found'));
  store.specifications.delete(req.params.specId);
  res.status(204).end();
});

module.exports = router;
