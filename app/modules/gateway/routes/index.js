const express = require('express');
const router = express.Router();

const trackingRoutes = require('./tracking');
router.use(`/tracking`, trackingRoutes);

const memoryRoutes = require('./memory');
router.use(`/memory`, memoryRoutes);

const jobRoutes = require('./job');
router.use(`/job`, jobRoutes);

const logRoutes = require('./log');
router.use(`/log`, logRoutes);

const caseRoutes = require('./case-mpit');
router.use(`/case-mpit`, caseRoutes);

module.exports = router;
