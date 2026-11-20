'use strict';

const { Router } = require('express');

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: >
 *       Returns the current health status of the API, including process uptime
 *       and a server-side timestamp. Use this endpoint for liveness probes.
 *     responses:
 *       200:
 *         description: API is healthy and accepting requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             example:
 *               status: ok
 *               uptime: 42.5
 *               timestamp: '2026-11-20T12:00:00.000Z'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
