import React, { useState, useContext, useEffect } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { Save, XSquare, Trash2, AlertTriangle } from 'react-feather';
import '../App.css';

const ProjectForm = () => {
  const { selectedProject, addProject, updateProject, setViewMode, loading, error: contextError, clearError, viewMode, removeProject } = useContext(ProjectContext);
  
  const isEditMode = !!selectedProject && (viewMode === 'edit_form');

  const [formData, setFormData] = useState({
    project_name: '',
    project_identifier: '',
    client_ip_address: '',
    notes: ''
  });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    clearError();
    setFormError(null);
    if (isEditMode && selectedProject) {
      setFormData({
        project_name: selectedProject.project_name || '',
        project_identifier: selectedProject.project_identifier || '',
        client_ip_address: selectedProject.client_ip_address || '',
        notes: selectedProject.notes || ''
      });
    } else {
      setFormData({
        project_name: '',
        project_identifier: '',
        client_ip_address: '',
        notes: ''
      });
    }
  }, [isEditMode, selectedProject, clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!formData.project_name.trim() || !formData.project_identifier.trim()) {
      setFormError('Project Name and Project Identifier are required.');
      return;
    }

    try {
      if (isEditMode) {
        await updateProject(selectedProject.id, formData);
      } else {
        await addProject(formData);
      }
    } catch (err) {
      setFormError(err.message || (isEditMode ? 'Failed to update project.' : 'Failed to add project.'));
    }
  };

  const handleDelete = async () => {
    if (isEditMode && selectedProject && window.confirm(`Are you sure you want to delete project "${selectedProject.project_name}"? This action cannot be undone.`)) {
        try {
            await removeProject(selectedProject.id);
        } catch (err) {
            setFormError(err.message || 'Failed to delete project.');
        }
    }
  };

  return (
    <div className="Content-card Form-container">
      <h2>{isEditMode ? 'Edit Project' : 'Add New Project'}</h2>
      {(contextError || formError) && 
        <p className="Error-message-general">
          <AlertTriangle size={18} /> 
          {contextError || formError}
        </p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="project_name">Project Name *</label>
          <input
            type="text"
            id="project_name"
            name="project_name"
            value={formData.project_name}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
        <div>
          <label htmlFor="project_identifier">Project Identifier *</label>
          <input
            type="text"
            id="project_identifier"
            name="project_identifier"
            value={formData.project_identifier}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
        <div>
          <label htmlFor="client_ip_address">Client IP Address (Optional)</label>
          <input
            type="text"
            id="client_ip_address"
            name="client_ip_address"
            value={formData.client_ip_address}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div className="Form-actions">
          {isEditMode && (
              <button type="button" onClick={handleDelete} className="delete-button" disabled={loading}>
                  <Trash2 size={16}/> {loading ? 'Deleting...' : 'Delete Project'}
              </button>
          )}
          <button type="button" onClick={() => setViewMode('details')} className="cancel-button" disabled={loading}>
              <XSquare size={16}/> Cancel
          </button>
          <button type="submit" disabled={loading}>
            <Save size={16}/> {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Project')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm; 