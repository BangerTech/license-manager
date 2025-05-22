import React, { useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { Edit3, CheckCircle, AlertTriangle, Info, Calendar, Clock, Eye } from 'react-feather';
import '../App.css';

const ProjectDetails = () => {
  const { selectedProject, changeProjectStatus, setViewMode, loading, error } = useContext(ProjectContext);

  if (loading && !selectedProject) {
    return <div className="Content-card"><p>Loading project details...</p></div>;
  }

  if (error && !selectedProject) {
    return (
      <div className="Content-card">
        <p className="Error-message-general"><AlertTriangle size={18} />Error: {error}</p>
      </div>
    );
  }
  
  if (!selectedProject) {
    return (
        <div className="Content-card">
            <h2>Welcome</h2>
            <p>Select a project to view its details or add a new one using the sidebar icons.</p>
        </div>
    );
  }

  const handleStatusChange = async (status) => {
    if (window.confirm(`Are you sure you want to set status to ${status.replace('_',' ')}?`)) {
        try {
            await changeProjectStatus(selectedProject.id, status);
        } catch (err) {
            // Error is already set in ProjectContext and might be displayed by a global error handler/toast.
        }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusInfo = (status) => {
    switch (status) {
        case 'NOT_PAID': 
            return { 
                icon: <AlertTriangle size={18} />, 
                text: 'Not Paid', 
                colorVar: 'var(--status-high-priority-bg)'
            };
        case 'PARTIALLY_PAID': 
            return { 
                icon: <Info size={18} />, 
                text: 'Partially Paid', 
                colorVar: 'var(--status-design-bg)'
            };
        case 'FULLY_PAID': 
            return { 
                icon: <CheckCircle size={18} />, 
                text: 'Fully Paid', 
                colorVar: 'var(--status-low-priority-bg)'
            };
        default: 
            return { 
                icon: <Eye size={18} />, 
                text: status.replace('_',' '), 
                colorVar: 'var(--text-secondary)'
            };
    }
  }

  const currentStatusInfo = getStatusInfo(selectedProject.license_status);

  return (
    <div className="Content-card">
      <h2>{selectedProject.project_name}</h2>
      {error && <p className="Error-message-general"><AlertTriangle size={18} />Last operation error: {error}</p>} 
      
      <div className="Project-info-grid">
        <p><strong>Identifier:</strong> {selectedProject.project_identifier}</p>
        <p><strong>Client IP:</strong> {selectedProject.client_ip_address || 'N/A'}</p>
        <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong>Status:</strong> 
            {currentStatusInfo.icon}
            <span style={{ fontWeight: '600', color: currentStatusInfo.colorVar }}>
                {currentStatusInfo.text}
            </span>
        </p>
        <p><Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'bottom' }} /><strong>Created:</strong> {formatDate(selectedProject.created_at)}</p>
        <p><Clock size={16} style={{ marginRight: '8px', verticalAlign: 'bottom' }} /><strong>Last Updated:</strong> {formatDate(selectedProject.updated_at)}</p>
      </div>

      <p><strong>Notes:</strong> {selectedProject.notes || 'N/A'}</p>
      
      <div className="Status-buttons-container">
        <button 
          onClick={() => handleStatusChange('NOT_PAID')} 
          className={`not-paid ${selectedProject.license_status === 'NOT_PAID' ? 'current-status' : ''}`}
          disabled={loading}
        >
          <AlertTriangle size={16}/>Not Paid
        </button>
        <button 
          onClick={() => handleStatusChange('PARTIALLY_PAID')} 
          className={`partially-paid ${selectedProject.license_status === 'PARTIALLY_PAID' ? 'current-status' : ''}`}
          disabled={loading}
        >
          <Info size={16}/>Partially Paid
        </button>
        <button 
          onClick={() => handleStatusChange('FULLY_PAID')} 
          className={`fully-paid ${selectedProject.license_status === 'FULLY_PAID' ? 'current-status' : ''}`}
          disabled={loading}
        >
          <CheckCircle size={16}/>Fully Paid
        </button>
      </div>

      <div className="Form-actions" style={{ marginTop: '30px', justifyContent: 'flex-start' }}>
        <button 
            onClick={() => setViewMode('edit_form', selectedProject)} 
            disabled={loading} 
            className="edit-button"
            style={{ backgroundColor: 'var(--btn-secondary-bg)', color: 'var(--btn-secondary-text)'}}
        >
            <Edit3 size={16}/>Edit Project
        </button>
      </div>
    </div>
  );
};

export default ProjectDetails; 