'use strict';

const { Router } = require('express');
const createError = require('http-errors');
const store = require('../store');

const router = Router();

const NOTIFICATION_TYPES = ['status_change', 'warranty_expiry', 'maintenance', 'licensing', 'inventory', 'custom'];

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications
 *     parameters:
 *       - in: query
 *         name: assetId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [status_change, warranty_expiry, maintenance, licensing, inventory, custom]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, cancelled]
 *     responses:
 *       200:
 *         description: Array of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 total:
 *                   type: integer
 */
router.get('/', (req, res) => {
  const { assetId, type, status } = req.query;
  let items = Array.from(store.notifications.values());
  if (assetId) items = items.filter(n => n.assetId === String(assetId));
  if (type) items = items.filter(n => n.type === type);
  if (status) items = items.filter(n => n.status === status);
  res.json({ data: items, total: items.length });
});

/**
 * @openapi
 * /notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Create a notification or scheduled reminder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationInput'
 *     responses:
 *       201:
 *         description: Created notification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', (req, res, next) => {
  const { type, assetId, message, scheduledAt } = req.body;
  if (!type || !message) return next(createError(400, 'type and message are required'));
  if (!NOTIFICATION_TYPES.includes(type)) {
    return next(createError(400, `Invalid type. Must be one of: ${NOTIFICATION_TYPES.join(', ')}`));
  }
  if (assetId && !store.assets.has(String(assetId))) {
    return next(createError(404, 'Asset not found'));
  }
  const id = store.nextId();
  const now = new Date().toISOString();
  const notification = {
    id,
    type,
    assetId: assetId ? String(assetId) : null,
    message,
    scheduledAt: scheduledAt || null,
    sentAt: null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  store.notifications.set(id, notification);
  res.status(201).json({ data: notification });
});

/**
 * @openapi
 * /notifications/{id}:
 *   get:
 *     tags: [Notifications]
 *     summary: Get a notification by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', (req, res, next) => {
  const notification = store.notifications.get(req.params.id);
  if (!notification) return next(createError(404, 'Notification not found'));
  res.json({ data: notification });
});

/**
 * @openapi
 * /notifications/{id}:
 *   put:
 *     tags: [Notifications]
 *     summary: Update a notification
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
 *             $ref: '#/components/schemas/NotificationInput'
 *     responses:
 *       200:
 *         description: Updated notification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', (req, res, next) => {
  const notification = store.notifications.get(req.params.id);
  if (!notification) return next(createError(404, 'Notification not found'));
  const { message, scheduledAt, status } = req.body;
  if (message) notification.message = message;
  if (scheduledAt !== undefined) notification.scheduledAt = scheduledAt;
  if (status) notification.status = status;
  notification.updatedAt = new Date().toISOString();
  res.json({ data: notification });
});

/**
 * @openapi
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
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
  if (!store.notifications.has(req.params.id)) return next(createError(404, 'Notification not found'));
  store.notifications.delete(req.params.id);
  res.status(204).end();
});

module.exports = router;
