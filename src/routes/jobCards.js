'use strict';

const { Router } = require('express');
const createError = require('http-errors');
const store = require('../store');

const router = Router();

/**
 * @openapi
 * /job-cards:
 *   get:
 *     tags: [JobCards]
 *     summary: List all job cards
 *     parameters:
 *       - in: query
 *         name: assetId
 *         schema:
 *           type: string
 *         description: Filter by asset ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, signed, closed]
 *         description: Filter by job card status
 *     responses:
 *       200:
 *         description: Array of job cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JobCard'
 *                 total:
 *                   type: integer
 */
router.get('/', (req, res) => {
  const { assetId, status } = req.query;
  let items = Array.from(store.jobCards.values());
  if (assetId) items = items.filter(j => j.assetId === String(assetId));
  if (status) items = items.filter(j => j.status === status);
  res.json({ data: items, total: items.length });
});

/**
 * @openapi
 * /job-cards:
 *   post:
 *     tags: [JobCards]
 *     summary: Create a job card for an asset under repair
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobCardInput'
 *     responses:
 *       201:
 *         description: Created job card
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/JobCard'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/', (req, res, next) => {
  const { assetId, vendorName, vendorContact, issueDescription } = req.body;
  if (!assetId) return next(createError(400, 'assetId is required'));
  if (!store.assets.has(String(assetId))) return next(createError(404, 'Asset not found'));
  const id = store.nextId();
  const now = new Date().toISOString();
  const jobCard = {
    id,
    assetId: String(assetId),
    vendorName: vendorName || null,
    vendorContact: vendorContact || null,
    issueDescription: issueDescription || null,
    status: 'open',
    vendorSignedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  store.jobCards.set(id, jobCard);
  res.status(201).json({ data: jobCard });
});

/**
 * @openapi
 * /job-cards/{id}:
 *   get:
 *     tags: [JobCards]
 *     summary: Get a job card by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job card detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/JobCard'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', (req, res, next) => {
  const jobCard = store.jobCards.get(req.params.id);
  if (!jobCard) return next(createError(404, 'Job card not found'));
  res.json({ data: jobCard });
});

/**
 * @openapi
 * /job-cards/{id}:
 *   put:
 *     tags: [JobCards]
 *     summary: Update job card vendor details
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
 *             $ref: '#/components/schemas/JobCardInput'
 *     responses:
 *       200:
 *         description: Updated job card
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/JobCard'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', (req, res, next) => {
  const jobCard = store.jobCards.get(req.params.id);
  if (!jobCard) return next(createError(404, 'Job card not found'));
  const { vendorName, vendorContact, issueDescription } = req.body;
  if (vendorName !== undefined) jobCard.vendorName = vendorName;
  if (vendorContact !== undefined) jobCard.vendorContact = vendorContact;
  if (issueDescription !== undefined) jobCard.issueDescription = issueDescription;
  jobCard.updatedAt = new Date().toISOString();
  res.json({ data: jobCard });
});

/**
 * @openapi
 * /job-cards/{id}/sign:
 *   patch:
 *     tags: [JobCards]
 *     summary: Mark a job card as vendor-signed (re-upload confirmation)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job card marked as signed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/JobCard'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/sign', (req, res, next) => {
  const jobCard = store.jobCards.get(req.params.id);
  if (!jobCard) return next(createError(404, 'Job card not found'));
  const now = new Date().toISOString();
  jobCard.status = 'signed';
  jobCard.vendorSignedAt = now;
  jobCard.updatedAt = now;
  if (req.body && req.body.notes) jobCard.notes = req.body.notes;
  res.json({ data: jobCard });
});

/**
 * @openapi
 * /job-cards/{id}/close:
 *   patch:
 *     tags: [JobCards]
 *     summary: Close a job card after repair completion
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job card closed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/JobCard'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/close', (req, res, next) => {
  const jobCard = store.jobCards.get(req.params.id);
  if (!jobCard) return next(createError(404, 'Job card not found'));
  jobCard.status = 'closed';
  jobCard.updatedAt = new Date().toISOString();
  res.json({ data: jobCard });
});

module.exports = router;
