// frontend/src/context/ProjectContext.js
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import {
  fetchProjects as apiFetchProjects,
  createProject as apiCreateProject,
  updateProjectDetails as apiUpdateProjectDetails,
  updateProjectStatus as apiUpdateProjectStatus,
  deleteProject as apiDeleteProject,
  fetchProjectById as apiFetchProjectById
} from '../services/api';
import { AuthContext } from './AuthContext';

export const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const { authToken } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('details'); // 'details', 'add_form', 'edit_form'

  const clearError = () => setError(null);

  const loadProjects = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    clearError();
    try {
      const data = await apiFetchProjects();
      setProjects(data || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.message || 'Failed to fetch projects.');
      setProjects([]); // Clear projects on error
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const selectProject = useCallback(async (projectId) => {
    if (!projectId) {
        setSelectedProject(null);
        setViewMode('details'); // Or a welcome screen
        return;
    }
    setLoading(true);
    clearError();
    try {
        // Option 1: Find from existing list (if comprehensive)
        // const project = projects.find(p => p.id === projectId);
        // setSelectedProject(project || null);

        // Option 2: Always fetch fresh details (better for consistency)
        const projectDetails = await apiFetchProjectById(projectId);
        setSelectedProject(projectDetails);
        setViewMode('details');
    } catch (err) {
        console.error(`Error fetching project ${projectId}:`, err);
        setError(err.message || `Failed to fetch project ${projectId}.`);
        setSelectedProject(null); // Clear selection on error
    } finally {
        setLoading(false);
    }
  }, [projects]);

  const addProject = async (projectData) => {
    setLoading(true);
    clearError();
    try {
      const newProject = await apiCreateProject(projectData);
      setProjects(prevProjects => [newProject, ...prevProjects]);
      setSelectedProject(newProject);
      setViewMode('details');
      return newProject;
    } catch (err) {
      console.error("Error creating project:", err);
      setError(err.message || 'Failed to create project.');
      throw err; // Re-throw for form to handle
    }
  };

  const updateProject = async (projectId, projectData) => {
    setLoading(true);
    clearError();
    try {
      const updatedProject = await apiUpdateProjectDetails(projectId, projectData);
      setProjects(prevProjects => 
        prevProjects.map(p => (p.id === projectId ? updatedProject : p))
      );
      setSelectedProject(updatedProject);
      setViewMode('details');
      return updatedProject;
    } catch (err) {
      console.error("Error updating project:", err);
      setError(err.message || 'Failed to update project.');
      throw err; // Re-throw for form to handle
    }
  };

  const changeProjectStatus = async (projectId, status) => {
    setLoading(true);
    clearError();
    try {
      const updatedProject = await apiUpdateProjectStatus(projectId, status);
      setProjects(prevProjects => 
        prevProjects.map(p => (p.id === projectId ? updatedProject : p))
      );
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(updatedProject);
      }
      return updatedProject;
    } catch (err) {
      console.error("Error updating project status:", err);
      setError(err.message || 'Failed to update project status.');
      throw err; // Re-throw for component to handle
    } finally {
      setLoading(false); // Ensure loading is reset
    }
  };

  const removeProject = async (projectId) => {
    setLoading(true);
    clearError();
    try {
      await apiDeleteProject(projectId);
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(null);
        setViewMode('details'); // Go to a neutral state
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      setError(err.message || 'Failed to delete project.');
      throw err; // Re-throw for component to handle
    }
  };

  const handleSetViewMode = (mode, projectToEdit = null) => {
    clearError();
    if (mode === 'edit_form' && projectToEdit) {
        setSelectedProject(projectToEdit); // Ensure the correct project is selected for editing
    } else if (mode === 'add_form' || mode === 'info' || mode === 'settings') {
        setSelectedProject(null); // Clear selection when adding new or showing general info/settings pages
    } else if (mode === 'dashboard') {
        setSelectedProject(null); // Also clear for dashboard explicitly
    }
    setViewMode(mode);
  };

  const clearSelectedProject = () => {
    setSelectedProject(null);
    setViewMode('dashboard'); // Explicitly set view to dashboard
    clearError(); // Also clear any errors when navigating away
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      selectedProject,
      loading,
      error,
      viewMode,
      loadProjects,
      selectProject,
      clearSelectedProject,
      addProject,
      updateProject,
      changeProjectStatus,
      removeProject,
      setViewMode: handleSetViewMode,
      clearError
    }}>
      {children}
    </ProjectContext.Provider>
  );
}; 