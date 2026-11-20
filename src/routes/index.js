'use strict';

const { Router } = require('express');
const healthRouter = require('./health');
const categoriesRouter = require('./categories');
const assetsRouter = require('./assets');
const employeesRouter = require('./employees');
const jobCardsRouter = require('./jobCards');
const dashboardRouter = require('./dashboard');
const reportsRouter = require('./reports');
const notificationsRouter = require('./notifications');
const usersRouter = require('./users');

const router = Router();

router.use('/health', healthRouter);
router.use('/categories', categoriesRouter);
router.use('/assets', assetsRouter);
router.use('/employees', employeesRouter);
router.use('/job-cards', jobCardsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/reports', reportsRouter);
router.use('/notifications', notificationsRouter);
router.use('/users', usersRouter);

module.exports = router;
