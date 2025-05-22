// frontend/src/App.js
// import logo from './logo.svg'; // If you have a logo
import './App.css';
import './index.css'; // Ensure global styles including CSS variables are loaded
import React, { useContext, useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ProjectProvider, ProjectContext } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import ProjectList from './components/ProjectList';
import ProjectDetails from './components/ProjectDetails';
import ProjectForm from './components/ProjectForm';
import { Package, Calendar, Activity, Edit2, Search, Plus, Settings as SettingsIcon, MoreHorizontal, AlertTriangle, PlusCircle } from 'react-feather';
import logo from './assets/logo.png'; // Import the logo
import DashboardOverview from './components/DashboardOverview';
import MainContentHeader from './components/MainContentHeader';
import InfoPage from './components/InfoPage';
import SettingsPage from './components/SettingsPage'; // Import the new SettingsPage
import NotificationsPage from './components/NotificationsPage';

const MainContentArea = () => {
  const { viewMode, selectedProject, projectsLoading, projectsError } = useContext(ProjectContext);

  if (projectsLoading && viewMode !== 'info' && viewMode !== 'settings' && viewMode !== 'notifications') {
    return <div className="loading-main-content">Loading projects...</div>;
  }
  if (projectsError && viewMode !== 'info' && viewMode !== 'settings' && viewMode !== 'notifications') {
    return <div className="error-main-content">Error loading projects: {projectsError}</div>;
  }

  switch (viewMode) {
    case 'dashboard':
      return <DashboardOverview />;
    case 'details':
      return selectedProject ? <ProjectDetails project={selectedProject} /> : <DashboardOverview />;
    case 'add_form':
      return <ProjectForm />;
    case 'edit_form':
      return selectedProject ? <ProjectForm projectToEdit={selectedProject} /> : <DashboardOverview />;
    case 'info':
      return <InfoPage />;
    case 'settings':
      return <SettingsPage />;
    case 'notifications':
      return <NotificationsPage />;
    default:
      return <DashboardOverview />;
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
  const { authToken, loading: authLoading /*, checkAuth */ } = useContext(AuthContext);
  // const { viewMode, selectedProject, projectsLoading, projectsError } = useContext(ProjectContext);

  useEffect(() => {
    // checkAuth(); // This was causing the error, and AuthContext already handles token validation on load
  }, [/* checkAuth */]); // Dependency removed

  if (authLoading) {
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
         <ProjectProvider>
            <AppContent />
         </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 