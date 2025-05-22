import React, { useState, useEffect, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import '../App.css'; // For common styles

const InfoPage = () => {
  const { setViewMode } = useContext(ProjectContext);
  const [readmeContent, setReadmeContent] = useState('');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // In a real CRA app, you would place README.md in the public folder
    // and fetch it. For this environment, we'll simulate by fetching from a path
    // that Nginx *could* serve if README.md were in the build's root.
    // However, for simplicity in this simulated environment, we will directly embed
    // a placeholder or fetch from a known absolute path if available.
    // Since we cannot directly read files from the project root in React component code
    // without specific build configurations (like raw-loader for webpack),
    // we will use a placeholder text for now.
    // In a real scenario, you might fetch `/README.md` if it's in the public folder.

    // Placeholder README content
    const placeholderReadme = `
# License Manager Project\n\nThis application helps manage software licenses.\n\n## Features\n- Feature 1\n- Feature 2\n- ...\n\n## Setup\nRefer to the main README.md for setup instructions.\n
## API\nDetails about the API can be found in the main project documentation.\n
## Client Integration\nSee client_license_check_example.js for an example.\n
*(This is placeholder content. In a real build, this would be loaded from README.md)*
    `;
    // Simulate fetching README.md content
    // In a real app: fetch('/README.md').then(res => res.text()).then(text => setReadmeContent(text));
    // For now, using placeholder:
    // setReadmeContent("Failed to load README.md. Please ensure it is in the public folder and accessible.");
    setReadmeContent(placeholderReadme.replace(/\n/g, '<br />')); // Basic conversion for display

  }, []);

  return (
    <div className="InfoPage-container app-style-container">
      {/* <MainContentHeader /> // Already rendered in App.js based on viewMode */}
      <div className="info-content app-style-card">
        <h2>Project Information</h2>
        {/* Using dangerouslySetInnerHTML is generally risky if the content isn't controlled.
            Here, we assume README.md is safe. For user-generated content, sanitize it! */}
        <div dangerouslySetInnerHTML={{ __html: readmeContent }} />
        
        <hr style={{margin: '20px 0'}} />

        <h3>About This Application</h3>
        <p>
          This License Management System is designed to provide a centralized solution for 
          tracking and validating software licenses. It features a backend API for license checks 
          and administrative operations, and a modern frontend for easy management.
        </p>
        <p>
          The system is built using Docker for containerization, Node.js/Express for the backend API, 
          PostgreSQL for the database, and React for the frontend user interface.
        </p>

        <h3>Development Team</h3>
        <p>BangerTech</p>

        <div className="copyright-footer" style={{ marginTop: '30px', textAlign: 'center', color: 'var(--text-color-secondary)' }}>
          <p>&copy; {currentYear} BangerTech. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default InfoPage; 