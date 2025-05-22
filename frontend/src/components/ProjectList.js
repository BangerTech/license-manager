import React, { useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { PlusCircle, LogOut, Sun, Moon, Home, List, Info, User, Settings, Bell } from 'react-feather';
import '../App.css';

const ProjectList = () => {
  const { selectedProject, selectProject, setViewMode, clearSelectedProject, projects, viewMode } = useContext(ProjectContext);
  const { logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  // Helper to handle navigation, clears selected project for dashboard view
  const navigateToDashboard = () => {
    clearSelectedProject(); // This should implicitly set viewMode to dashboard in App.js logic
    // Or, if explicit viewMode setting is preferred:
    // setViewMode('dashboard'); 
  };

  // Placeholder: In a more complex app, projects might be shown in a modal or a dedicated "list view" page
  // For now, clicking a project icon could directly select it if we list them here with icons.
  // However, the image implies a main dashboard area where projects are cards.
  // So, this sidebar primarily has navigation icons.

  return (
    <aside className="Floating-sidebar">
      <div className="Sidebar-top-actions">
        {/* User Profile/Logo Placeholder */}
        <button className={`Sidebar-icon User-profile-icon`} title="User Profile">
            <User size={28} /> {/* Larger icon for profile */}
        </button>
      </div>
      <nav>
        <ul>
          <li>
            <button className={`Sidebar-icon ${viewMode === 'dashboard' ? 'active' : ''}`} onClick={navigateToDashboard} title="Dashboard">
              <Home size={24} />
            </button>
          </li>
          {/* Placeholder for future navigation items like a dedicated Project List or other views */}
          {/* Example:
          <li>
            <button className={`Sidebar-icon`} title="All Tasks">
              <List size={24} /> 
            </button>
          </li>
          */}
          <li>
            <button className={`Sidebar-icon ${viewMode === 'add_form' ? 'active' : ''}`} onClick={() => setViewMode('add_form')} title="Add New Project">
              <PlusCircle size={24} />
            </button>
          </li>
          {/* Example placeholder icons from image inspiration */}
          <li>
            <button className={`Sidebar-icon ${viewMode === 'notifications' ? 'active' : ''}`} onClick={() => setViewMode('notifications')} title="Notifications (Placeholder)">
                <Bell size={24} />
            </button>
          </li>
           <li>
            <button className={`Sidebar-icon ${viewMode === 'info' ? 'active' : ''}`} onClick={() => setViewMode('info')} title="System Info">
                <Info size={24} />
            </button>
          </li>
        </ul>
      </nav>

      <div className="Sidebar-bottom-actions">
        <button className="Sidebar-icon" onClick={toggleTheme} title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
          {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
        </button>
        <button className={`Sidebar-icon ${viewMode === 'settings' ? 'active' : ''}`} onClick={() => setViewMode('settings')} title="Settings">
            <Settings size={22} />
        </button>
        <button className="Sidebar-icon" onClick={logout} title="Logout">
          <LogOut size={22} />
        </button>
      </div>
    </aside>
  );
};

export default ProjectList; 