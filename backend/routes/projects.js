const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/projects - Retrieves a list of all projects
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects - Creates a new project
router.post('/', async (req, res, next) => {
  const { project_name, project_identifier, client_ip_address, notes } = req.body;

  if (!project_name || !project_identifier) {
    return res.status(400).json({ error: 'Project name and identifier are required.' });
  }

  try {
    const query = `
      INSERT INTO projects (project_name, project_identifier, client_ip_address, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [project_name, project_identifier, client_ip_address, notes];
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Project name or identifier already exists.', detail: err.detail });
    }
    next(err);
  }
});

// GET /api/projects/:projectId - Retrieves a specific project by ID
router.get('/:projectId', async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const { rows } = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:projectId/status - Updates the license status of a specific project
router.put('/:projectId/status', async (req, res, next) => {
  const { projectId } = req.params;
  const { license_status } = req.body;

  if (!license_status || !['NOT_PAID', 'PARTIALLY_PAID', 'FULLY_PAID'].includes(license_status)) {
    return res.status(400).json({ error: 'Invalid license status. Must be one of NOT_PAID, PARTIALLY_PAID, FULLY_PAID.' });
  }

  try {
    const query = `
      UPDATE projects
      SET license_status = $1
      WHERE id = $2
      RETURNING *;
    `;
    const values = [license_status, projectId];
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:projectId - Updates details of a specific project (name, identifier, ip, notes)
router.put('/:projectId', async (req, res, next) => {
    const { projectId } = req.params;
    const { project_name, project_identifier, client_ip_address, notes } = req.body;

    if (!project_name && !project_identifier && client_ip_address === undefined && notes === undefined) {
        return res.status(400).json({ error: 'No update fields provided.' });
    }
    
    // Dynamically build the query based on provided fields
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (project_name !== undefined) {
        fields.push(`project_name = $${paramCount++}`);
        values.push(project_name);
    }
    if (project_identifier !== undefined) {
        fields.push(`project_identifier = $${paramCount++}`);
        values.push(project_identifier);
    }
    if (client_ip_address !== undefined) {
        fields.push(`client_ip_address = $${paramCount++}`);
        values.push(client_ip_address);
    }
    if (notes !== undefined) {
        fields.push(`notes = $${paramCount++}`);
        values.push(notes);
    }
    
    if (fields.length === 0) {
         return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    values.push(projectId); // Add projectId as the last parameter for WHERE clause

    const query = `
        UPDATE projects
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *;
    `;

    try {
        const { rows } = await db.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Project not found.' });
        }
        res.json(rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
          return res.status(409).json({ error: 'Project name or identifier already exists.', detail: err.detail });
        }
        next(err);
    }
});


// DELETE /api/projects/:projectId - Deletes a project
router.delete('/:projectId', async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.status(204).send(); // No content
  } catch (err) {
    next(err);
  }
});

module.exports = router; 