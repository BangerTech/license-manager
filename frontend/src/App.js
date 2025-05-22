// frontend/src/App.js
// import logo from './logo.svg'; // If you have a logo
import './App.css';
import React, { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ProjectProvider, ProjectContext } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import ProjectList from './components/ProjectList';
import ProjectDetails from './components/ProjectDetails';
import ProjectForm from './components/ProjectForm';
import { Package, Calendar, Activity, Edit2, Search, Plus, Settings as SettingsIcon, MoreHorizontal, AlertTriangle, PlusCircle } from 'react-feather';

// New component for the header within the main content area
const MainContentHeader = ({ breadcrumbTitle, pageTitle, onNavigateHome }) => {
  return (
    <div className="Main-content-header">
      <div className="Main-content-header-left">
        <div className="Breadcrumbs">
          <span className="Breadcrumb-base" onClick={onNavigateHome} style={{cursor: 'pointer'}}>Home</span>
          {breadcrumbTitle && breadcrumbTitle.toLowerCase() !== 'dashboard' && (
            <>
              <span className="Breadcrumb-separator"> &gt; </span>
              <span className="Breadcrumb-current">{breadcrumbTitle}</span>
            </>
          )}
        </div>
        <h1>{pageTitle}</h1>
      </div>
      <div className="Main-content-header-right">
        <div className="Search-bar-placeholder app-style-search">
          <Search size={18} />
          <input type="text" placeholder="Search..." />
        </div>
        {/* Settings icon is now part of the sidebar as per latest request, so not repeated here unless specified */}
        {/* If settings needs to be here, uncomment:
        <button className="Sidebar-icon" title="Settings (Placeholder)">
            <SettingsIcon size={20} />
        </button> 
        */}
      </div>
    </div>
  );
};

const DashboardOverview = () => {
  const { projects, loading, error, selectProject, setViewMode } = useContext(ProjectContext);

  const handleProjectSelect = (projectId) => {
    selectProject(projectId);
    setViewMode('details');
  };

  if (loading && projects.length === 0) { // Show loading only if there are no projects yet
    return (
      <div className="Content-card">
        <h2>Dashboard Overview</h2>
        <p>Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="Content-card">
        <h2>Dashboard Overview</h2>
        <p className="Error-message-general"><AlertTriangle size={18} /> Error fetching projects: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="Content-card" style={{ background: 'var(--bg-secondary)', boxShadow: 'none' }}> {/* Slightly different background for overview page itself */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Dashboard</h2>
        {/* Placeholder for potential actions like "Sort By", "Filter", etc. */}
        {projects.length === 0 && !loading && (
          <button 
            className="Top-bar-action-button primary-button" 
            onClick={() => setViewMode('add_form')}
            style={{ marginLeft: 'auto' }} // Align to the right of the heading
          >
            <PlusCircle size={16} style={{ marginRight: '5px' }} /> Add New Project
          </button>
        )}
      </div>
      {projects.length === 0 && !loading && (
        <div className="Content-card" style={{textAlign: 'center'}}>
             <Package size={48} style={{marginBottom: '20px', color: 'var(--text-secondary)'}} />
            <h4>No Projects Yet</h4>
            <p>Get started by adding your first project using the <PlusCircle size={16} style={{verticalAlign: 'middle'}}/> icon in the sidebar.</p>
        </div>
      )}
      <div className="Dashboard-overview-grid">
        {projects.map(project => (
          <div 
            key={project.id} 
            className="Dashboard-project-card" 
            onClick={() => handleProjectSelect(project.id)}
            tabIndex={0} // Make it focusable
            onKeyPress={(e) => e.key === 'Enter' && handleProjectSelect(project.id)} // Keyboard accessible
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Package size={20} style={{ color: 'var(--text-accent)'}} />
                <h3 style={{ margin: 0 }}>{project.project_name}</h3>
            </div>
            <p><Activity size={14} style={{ verticalAlign: 'bottom', marginRight: '5px' }} /> <strong>Status:</strong> {project.license_status.replace('_', ' ')}</p>
            <p><Calendar size={14} style={{ verticalAlign: 'bottom', marginRight: '5px' }} /> <strong>Last Updated:</strong> {new Date(project.updated_at).toLocaleDateString()}</p>
            {/* Optional: Add a small edit icon/button to directly go to edit mode? */}
            {/* <button onClick={(e) => { e.stopPropagation(); setViewMode('edit_form', project); }} title="Edit"> <Edit2 size={14}/> </button> */}
          </div>
        ))}
      </div>
    </div>
  );
};

const MainContentArea = () => {
  const { viewMode, selectedProject } = useContext(ProjectContext);

  // Determine whether to show DashboardOverview
  // Show Dashboard if viewMode is 'dashboard' OR if no project is selected AND not in a form/details view
  const showDashboard = viewMode === 'dashboard' || 
                        (!selectedProject && viewMode !== 'add_form' && viewMode !== 'edit_form' && viewMode !== 'details');

  if (showDashboard) {
      return <DashboardOverview />;
  }

  switch (viewMode) {
    case 'add_form':
    case 'edit_form':
      return <ProjectForm />;
    case 'details':
      return <ProjectDetails />;
    case 'info':
      return <div className="Content-card"><p>Information Page Placeholder. Version 1.0.0. License Manager.</p></div>;
    case 'settings':
      return <div className="Content-card"><p>Settings Page Placeholder. (No configurable settings yet).</p></div>;
    case 'notifications':
      return <div className="Content-card"><p>Notifications Page Placeholder. (No notifications yet).</p></div>;
    default:
      // This case should ideally not be reached if showDashboard handles the default dashboard view.
      // However, as a fallback, or if selectedProject is true but viewMode is unexpected:
      if (selectedProject) return <ProjectDetails />; 
      return <DashboardOverview />; // Fallback to dashboard
  }
};

const ApplicationShell = () => {
  const { selectedProject, viewMode, clearSelectedProject: clearProjectSelectionFromContext } = useContext(ProjectContext);
  // const { user } = useContext(AuthContext); // User context can be used later if needed for profile info

  // Breadcrumb logic remains, will be used in MainContentArea header
  let breadcrumb = "Dashboard";
  if (selectedProject && viewMode === 'details') {
    breadcrumb = selectedProject.project_name;
  } else if (viewMode === 'add_form') {
    breadcrumb = "Add New Project";
  } else if (viewMode === 'edit_form' && selectedProject) {
    breadcrumb = `Edit: ${selectedProject.project_name}`;
  }

  // The main page title, distinct from breadcrumbs, can also be derived here or in MainContentArea
  let pageTitle = "Dashboard";
  if (viewMode === 'add_form') {
    pageTitle = "Add New Project";
  } else if (viewMode === 'info') {
    pageTitle = "Information";
  } else if (viewMode === 'settings') {
    pageTitle = "Settings";
  } else if (viewMode === 'notifications') {
    pageTitle = "Notifications";
  } else if (selectedProject && viewMode === 'details') {
    pageTitle = selectedProject.project_name;
  } else if (selectedProject && viewMode === 'edit_form') {
    pageTitle = `Edit: ${selectedProject.project_name}`;
  }

  return (
    <div className="App-shell">
      <div className="Layout-body">
        <ProjectList /> 
        <main className="Main-content-area">
          <MainContentHeader 
            breadcrumbTitle={breadcrumb} 
            pageTitle={pageTitle} 
            onNavigateHome={clearProjectSelectionFromContext} 
          />
          <MainContentArea /> { /* This renders DashboardOverview, ProjectForm, or ProjectDetails */}
        </main>
      </div>
    </div>
  );
};

function AppContent() {
  const { authToken, loading: authLoading } = useContext(AuthContext);
  // const { clearSelectedProject } = useContext(ProjectContext); // Removed: useContext called before Provider is rendered in this component's tree

  if (authLoading) {
    // Use the new login page container for loading consistency
    return <div className="Login-page-container"><h1>Loading Application...</h1></div>;
  }

  if (!authToken) {
    return <Login />;
  }

  // When authenticated, wrap with ProjectProvider and show the ApplicationShell
  // Also, ensure a way to return to the dashboard overview, e.g., by clicking a logo or home button.
  // For now, it defaults to dashboard if no project selected.
  return (
    <ProjectProvider>
      <ApplicationShell />
    </ProjectProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* ProjectProvider moved into AppContent for conditional rendering based on auth */}
        {/* This outer ProjectProvider might be redundant if AppContent always provides one when auth is successful */}
        {/* However, keeping a general provider here might be useful if some contexts need it pre-auth or for broader scope */}
        {/* For now, let's assume AppContent's ProjectProvider is the primary one for the dashboard area. */}
        {/* We will simplify this later if needed. For now, the nested structure is fine. */}
         {/* <ProjectProvider> */ } { /* Removing the outer ProjectProvider */ }
            <AppContent />
         {/* </ProjectProvider> */ } { /* Removing the outer ProjectProvider */ }
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 