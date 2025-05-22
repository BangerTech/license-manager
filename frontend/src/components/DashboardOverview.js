import React, { useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { Package, Calendar, Activity, PlusCircle, AlertTriangle } from 'react-feather';
import '../App.css'; // Assuming common styles are in App.css or index.css

const DashboardOverview = () => {
  const { projects, loading, error, selectProject, setViewMode } = useContext(ProjectContext);

  const handleProjectSelect = (projectId) => {
    selectProject(projectId); 
    // setViewMode('details'); // Navigation to details is usually handled by ProjectContext or App.js based on selectedProject
  };

  if (loading && projects.length === 0) {
    return (
      <div className="Content-card">
        <p>Loading projects...</p>
      </div>
    );
  }

  // Error is displayed via MainContentArea in App.js, but we can have a local one too if needed
  // if (error) {
  //   return (
  //     <div className="Content-card">
  //       <p className="Error-message-general"><AlertTriangle size={18} /> Error fetching projects: {error}</p>
  //     </div>
  //   );
  // }
  
  return (
    <div className="Content-card" style={{ background: 'var(--bg-secondary)', boxShadow: 'none', paddingTop: '0px' }}>
      {/* The header with title and Add button is now part of MainContentHeader in App.js */}
      {/* The DashboardOverview component itself will primarily render the grid or the no-projects message */}
      
      {projects.length === 0 && !loading && !error && (
        <div className="Content-card" style={{textAlign: 'center', marginTop: '20px'}}>
            <Package size={48} style={{marginBottom: '20px', color: 'var(--text-secondary)'}} />
            <h4>No Projects Yet</h4>
            <p>Get started by adding your first project.</p>
            <button 
              className="Button Button-primary"
              style={{marginTop: '10px'}}
              onClick={() => setViewMode('add_form')}
            >
              <PlusCircle size={16} style={{ marginRight: '8px' }} /> Add New Project
            </button>
        </div>
      )}

      {projects.length > 0 && (
        <div className="Dashboard-overview-grid">
          {projects.map(project => (
            <div 
              key={project.id} 
              className="Dashboard-project-card" 
              onClick={() => handleProjectSelect(project.id)}
              tabIndex={0} 
              onKeyPress={(e) => e.key === 'Enter' && handleProjectSelect(project.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <Package size={20} style={{ color: 'var(--text-accent)'}} />
                  <h3 style={{ margin: 0 }}>{project.project_name}</h3>
              </div>
              <p><Activity size={14} style={{ verticalAlign: 'bottom', marginRight: '5px' }} /> <strong>Status:</strong> {project.license_status.replace('_', ' ')}</p>
              <p><Calendar size={14} style={{ verticalAlign: 'bottom', marginRight: '5px' }} /> <strong>Last Updated:</strong> {new Date(project.updated_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardOverview; 