const express = require('express');
const router = express.Router();
const db = require('../db');
const { createNotification } = require('../services/notificationService');

// GET /api/projects - Retrieves a list of all projects
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ message: 'Error fetching projects', error: err.message, detail: err.detail });
  }
});

// POST /api/projects - Creates a new project
router.post('/', async (req, res, next) => {
  const { project_name, project_identifier, client_ip_address, notes } = req.body;
  const adminId = req.user.userId;
  const adminUsername = req.user.username;

  if (!project_name || !project_identifier) {
    return res.status(400).json({ message: 'Project name and identifier are required.' });
  }

  try {
    const query = `
      INSERT INTO projects (project_name, project_identifier, client_ip_address, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [project_name, project_identifier, client_ip_address, notes];
    const { rows } = await db.query(query, values);
    const newProject = rows[0];
    await createNotification(
      'PROJECT_CREATED',
      `Project "${newProject.project_name}" (ID: ${newProject.id}) was created by ${adminUsername}.`,
      { projectId: newProject.id, adminId, details: { projectName: newProject.project_name, projectIdentifier: newProject.project_identifier } }
    );
    res.status(201).json(newProject);
  } catch (err) {
    console.error('Error creating project:', err);
    await createNotification(
      'PROJECT_CREATE_ERROR',
      `Failed to create project "${project_name}" by ${adminUsername}.`,
      { adminId, details: { projectName: project_name, projectIdentifier: project_identifier, error: err.message, detail: err.detail } }
    );
    res.status(500).json({ message: 'Error creating project', error: err.message, detail: err.detail });
  }
});

// GET /api/projects/:projectId - Retrieves a specific project by ID
router.get('/:projectId', async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const { rows } = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching project ${projectId}:`, err);
    res.status(500).json({ message: 'Error fetching project', error: err.message, detail: err.detail });
  }
});

// PUT /api/projects/:projectId/status - Updates the license status of a specific project
router.put('/:projectId/status', async (req, res, next) => {
  const { projectId } = req.params;
  const { license_status } = req.body;
  const adminId = req.user.userId;
  const adminUsername = req.user.username;

  if (!license_status || !['NOT_PAID', 'PARTIALLY_PAID', 'FULLY_PAID'].includes(license_status)) {
    return res.status(400).json({ message: 'Invalid license status provided.' });
  }

  try {
    const oldProjectResult = await db.query('SELECT project_name, license_status FROM projects WHERE id = $1', [projectId]);
    if (oldProjectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const oldStatus = oldProjectResult.rows[0].license_status;
    const projectName = oldProjectResult.rows[0].project_name;

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
    const updatedProject = rows[0];
    await createNotification(
      'PROJECT_STATUS_UPDATED',
      `License status for project "${projectName}" (ID: ${projectId}) changed from ${oldStatus} to ${updatedProject.license_status} by ${adminUsername}.`,
      { projectId, adminId, details: { oldStatus, newStatus: updatedProject.license_status, projectName } }
    );
    res.json(updatedProject);
  } catch (err) {
    console.error(`Error updating status for project ${projectId}:`, err);
    await createNotification(
      'PROJECT_STATUS_UPDATE_ERROR',
      `Failed to update status for project ID ${projectId} by ${adminUsername}.`,
      { projectId, adminId, details: { error: err.message, detail: err.detail, requestedStatus: license_status } }
    );
    res.status(500).json({ message: 'Error updating project status', error: err.message, detail: err.detail });
  }
});

// PUT /api/projects/:projectId - Updates details of a specific project (name, identifier, ip, notes)
router.put('/:projectId', async (req, res, next) => {
  const { projectId } = req.params;
  const { project_name, project_identifier, client_ip_address, notes } = req.body;
  const adminId = req.user.userId;
  const adminUsername = req.user.username;

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
    const updatedProject = rows[0];
    await createNotification(
      'PROJECT_UPDATED',
      `Project "${updatedProject.project_name}" (ID: ${updatedProject.id}) was updated by ${adminUsername}.`,
      { projectId: updatedProject.id, adminId, details: { updatedFields: req.body } }
    );
    res.json(updatedProject);
  } catch (err) {
    console.error(`Error updating project ${projectId}:`, err);
    await createNotification(
      'PROJECT_UPDATE_ERROR',
      `Failed to update project "${project_name}" (ID: ${projectId}) by ${adminUsername}.`,
      { projectId, adminId, details: { error: err.message, detail: err.detail, updatedFields: req.body } }
    );
    res.status(500).json({ message: 'Error updating project', error: err.message, detail: err.detail });
  }
});

// DELETE /api/projects/:projectId - Deletes a project
router.delete('/:projectId', async (req, res, next) => {
  const { projectId } = req.params;
  const adminId = req.user.userId;
  const adminUsername = req.user.username;

  try {
    const projectResult = await db.query('SELECT project_name FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const projectName = projectResult.rows[0].project_name;

    const { rowCount } = await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    await createNotification(
      'PROJECT_DELETED',
      `Project "${projectName}" (ID: ${projectId}) was deleted by ${adminUsername}.`,
      { projectId, adminId, details: { projectName } }
    );
    res.status(204).send(); // No content
  } catch (err) {
    console.error(`Error deleting project ${projectId}:`, err);
    await createNotification(
      'PROJECT_DELETE_ERROR',
      `Failed to delete project ID ${projectId} by ${adminUsername}.`,
      { projectId, adminId, details: { error: err.message, detail: err.detail } }
    );
    res.status(500).json({ message: 'Error deleting project', error: err.message, detail: err.detail });
  }
});

module.exports = router; 