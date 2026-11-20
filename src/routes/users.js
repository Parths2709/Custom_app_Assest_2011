'use strict';

const { Router } = require('express');
const createError = require('http-errors');
const store = require('../store');

const router = Router();

const VALID_ROLES = ['Admin', 'User'];

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users
 *     responses:
 *       200:
 *         description: Array of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 */
router.get('/', (_req, res) => {
  const data = Array.from(store.users.values());
  res.json({ data, total: data.length });
});

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a user (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Created user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', (req, res, next) => {
  const { name, email, role } = req.body;
  if (!name || !email) return next(createError(400, 'name and email are required'));
  const assignedRole = role || 'User';
  if (!VALID_ROLES.includes(assignedRole)) {
    return next(createError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`));
  }
  const id = store.nextId();
  const now = new Date().toISOString();
  const user = { id, name, email, role: assignedRole, createdAt: now, updatedAt: now };
  store.users.set(id, user);
  res.status(201).json({ data: user });
});

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', (req, res, next) => {
  const user = store.users.get(req.params.id);
  if (!user) return next(createError(404, 'User not found'));
  res.json({ data: user });
});

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user (name, email, or role)
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
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', (req, res, next) => {
  const user = store.users.get(req.params.id);
  if (!user) return next(createError(404, 'User not found'));
  const { name, email, role } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) {
    if (!VALID_ROLES.includes(role)) {
      return next(createError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`));
    }
    user.role = role;
  }
  user.updatedAt = new Date().toISOString();
  res.json({ data: user });
});

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user
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
  if (!store.users.has(req.params.id)) return next(createError(404, 'User not found'));
  store.users.delete(req.params.id);
  res.status(204).end();
});

module.exports = router;
