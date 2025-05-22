const API_BASE_URL = '/api'; // All API calls will be relative to the frontend's origin

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

const request = async (endpoint, method = 'GET', body = null, customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 204) { // No Content
        return null; 
    }

    const responseData = await response.json();

    if (!response.ok) {
      // Attempt to improve error message from backend
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      if (responseData && responseData.error) {
        errorMessage = responseData.error;
        if(responseData.detail) errorMessage += ` (Details: ${responseData.detail})`;
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = responseData; // Attach full response data to error object
      throw error;
    }
    return responseData;
  } catch (error) {
    console.error(`API request to ${method} ${endpoint} failed:`, error);
    throw error; // Re-throw to be caught by calling function
  }
};

// Specific API functions
export const loginUser = (credentials) => {
  return request('/auth/login', 'POST', credentials);
};

export const fetchProjects = () => {
  return request('/projects', 'GET');
};

export const fetchProjectById = (projectId) => {
    return request(`/projects/${projectId}`, 'GET');
};

export const createProject = (projectData) => {
  return request('/projects', 'POST', projectData);
};

export const updateProjectStatus = (projectId, status) => {
  return request(`/projects/${projectId}/status`, 'PUT', { license_status: status });
};

export const updateProjectDetails = (projectId, projectData) => {
    return request(`/projects/${projectId}`, 'PUT', projectData);
};

export const deleteProject = (projectId) => {
    return request(`/projects/${projectId}`, 'DELETE');
};

export default request; 