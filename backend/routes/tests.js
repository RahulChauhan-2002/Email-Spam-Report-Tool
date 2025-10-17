const express = require('express');
const router = express.Router();
const { startTest, getReport } = require('../controllers/testController');

router.post('/', startTest);
router.get('/:id/report', getReport);

module.exports = router;
