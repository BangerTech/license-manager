const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/license/check_status?project_identifier={identifier}
router.get('/check_status', async (req, res, next) => {
  const { project_identifier } = req.query;

  if (!project_identifier) {
    return res.status(400).json({ error: 'Project identifier is required.' });
  }

  try {
    const { rows } = await db.query(
      'SELECT license_status FROM projects WHERE project_identifier = $1',
      [project_identifier]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or not registered.' });
    }

    res.json({ status: rows[0].license_status });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 