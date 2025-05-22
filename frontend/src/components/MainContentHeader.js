import React, { useContext } from 'react';
import { Search } from 'react-feather';
import { ProjectContext } from '../context/ProjectContext'; // To set viewMode for certain actions
import '../App.css'; // Assuming common styles are in App.css or index.css

const MainContentHeader = () => {
  const { viewMode, selectedProject, clearSelectedProject, projects } = useContext(ProjectContext);

  // Determine Breadcrumb and Page Title based on viewMode and selectedProject
  let breadcrumbCurrent = '';
  let pageTitle = 'Dashboard';

  if (viewMode === 'add_form') {
    pageTitle = 'Add New Project';
    breadcrumbCurrent = 'Add Project';
  } else if (viewMode === 'edit_form' && selectedProject) {
    pageTitle = `Edit: ${selectedProject.project_name}`;
    breadcrumbCurrent = selectedProject.project_name;
  } else if (viewMode === 'details' && selectedProject) {
    pageTitle = selectedProject.project_name;
    breadcrumbCurrent = selectedProject.project_name;
  } else if (viewMode === 'info') {
    pageTitle = 'Information';
    breadcrumbCurrent = 'Info';
  } else if (viewMode === 'settings') {
    pageTitle = 'Settings';
    breadcrumbCurrent = 'Settings';
  } else if (viewMode === 'notifications') {
    pageTitle = 'Notifications';
    breadcrumbCurrent = 'Notifications';
  } else if (viewMode === 'dashboard') {
    // For dashboard, pageTitle is 'Dashboard' and breadcrumbCurrent is empty or null
    // as 'Home' is the base.
    if (projects.length > 0 ){
        // Potentially show a count or other summary if needed, but for now just Dashboard title
    }
  }

  return (
    <div className="Main-content-header">
      <div className="Main-content-header-left">
        <div className="Breadcrumbs">
          <span 
            className="Breadcrumb-base"
            onClick={clearSelectedProject} 
            style={{cursor: 'pointer'}}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && clearSelectedProject()}
          >
            Home
          </span>
          {breadcrumbCurrent && (
            <>
              <span className="Breadcrumb-separator"> &gt; </span>
              <span className="Breadcrumb-current">{breadcrumbCurrent}</span>
            </>
          )}
        </div>
        <h1>{pageTitle}</h1>
      </div>
      <div className="Main-content-header-right">
        <div className="Search-bar-placeholder app-style-search">
          <Search size={18} />
          <input type="text" placeholder="Search projects..." />
        </div>
      </div>
    </div>
  );
};

export default MainContentHeader; 