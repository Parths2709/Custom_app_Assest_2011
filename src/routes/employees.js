'use strict';

const { Router } = require('express');
const createError = require('http-errors');
const store = require('../store');

const router = Router();

/**
 * @openapi
 * /employees:
 *   get:
 *     tags: [Employees]
 *     summary: List all employees
 *     responses:
 *       200:
 *         description: Array of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *                 total:
 *                   type: integer
 */
router.get('/', (_req, res) => {
  const data = Array.from(store.employees.values());
  res.json({ data, total: data.length });
});

/**
 * @openapi
 * /employees:
 *   post:
 *     tags: [Employees]
 *     summary: Create an employee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
 *     responses:
 *       201:
 *         description: Created employee
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', (req, res, next) => {
  const { name, email, department } = req.body;
  if (!name || !email) return next(createError(400, 'name and email are required'));
  const id = store.nextId();
  const now = new Date().toISOString();
  const employee = { id, name, email, department: department || null, createdAt: now, updatedAt: now };
  store.employees.set(id, employee);
  res.status(201).json({ data: employee });
});

/**
 * @openapi
 * /employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: Get employee details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', (req, res, next) => {
  const employee = store.employees.get(req.params.id);
  if (!employee) return next(createError(404, 'Employee not found'));
  res.json({ data: employee });
});

/**
 * @openapi
 * /employees/{id}:
 *   put:
 *     tags: [Employees]
 *     summary: Update an employee
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
 *             $ref: '#/components/schemas/EmployeeInput'
 *     responses:
 *       200:
 *         description: Updated employee
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', (req, res, next) => {
  const employee = store.employees.get(req.params.id);
  if (!employee) return next(createError(404, 'Employee not found'));
  const { name, email, department } = req.body;
  if (name) employee.name = name;
  if (email) employee.email = email;
  if (department !== undefined) employee.department = department;
  employee.updatedAt = new Date().toISOString();
  res.json({ data: employee });
});

/**
 * @openapi
 * /employees/{id}:
 *   delete:
 *     tags: [Employees]
 *     summary: Delete an employee
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
  if (!store.employees.has(req.params.id)) return next(createError(404, 'Employee not found'));
  store.employees.delete(req.params.id);
  res.status(204).end();
});

/**
 * @openapi
 * /employees/{id}/assets:
 *   get:
 *     tags: [Employees]
 *     summary: Get all assets allocated to an employee
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assets allocated to employee
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/assets', (req, res, next) => {
  if (!store.employees.has(req.params.id)) return next(createError(404, 'Employee not found'));
  const assets = Array.from(store.assets.values()).filter(a => a.employeeId === req.params.id);
  res.json({ data: assets, total: assets.length });
});

module.exports = router;
