'use strict';

const { Router } = require('express');
const store = require('../store');

const router = Router();

/**
 * @openapi
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get asset management dashboard summary
 *     description: >
 *       Returns total asset counts, allocation breakdown, status bifurcation,
 *       and inventory overview.
 *     responses:
 *       200:
 *         description: Dashboard summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/DashboardSummary'
 */
router.get('/', (_req, res) => {
  const assets = Array.from(store.assets.values());
  const total = assets.length;
  const allocated = assets.filter(a => a.employeeId !== null).length;
  const unallocated = total - allocated;

  const statusBreakdown = {};
  for (const asset of assets) {
    statusBreakdown[asset.status] = (statusBreakdown[asset.status] || 0) + 1;
  }

  const categoryBreakdown = {};
  for (const asset of assets) {
    const cat = store.categories.get(asset.categoryId);
    const label = cat ? cat.name : asset.categoryId;
    categoryBreakdown[label] = (categoryBreakdown[label] || 0) + 1;
  }

  res.json({
    data: {
      totalAssets: total,
      allocatedAssets: allocated,
      unallocatedAssets: unallocated,
      statusBreakdown,
      categoryBreakdown,
      totalCategories: store.categories.size,
      totalSubCategories: store.subCategories.size,
      totalEmployees: store.employees.size,
      openJobCards: Array.from(store.jobCards.values()).filter(j => j.status === 'open').length,
    },
  });
});

module.exports = router;
