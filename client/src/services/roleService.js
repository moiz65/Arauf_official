import { API_ENDPOINTS } from '../config/api';

// Roles API
export const rolesAPI = {
  // Get all roles
  getAll: async () => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/roles`);
    return response.json();
  },

  // Get single role
  getById: async (id) => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/roles/${id}`);
    return response.json();
  },

  // Create new role
  create: async (roleData) => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    });
    return response.json();
  },

  // Update role
  update: async (id, roleData) => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/roles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    });
    return response.json();
  },

  // Delete role
  delete: async (id) => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/roles/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Get modules accessible to a role (simplified: just module names)
  getModules: async (id) => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/roles/${id}/modules`);
    return response.json();
  },

  // Update modules for a role (simplified: just module names array)
  updateModules: async (id, modules) => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/roles/${id}/modules`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modules }),
    });
    return response.json();
  },
};

// Users API
export const usersAPI = {
  // Get all users
  getAll: async () => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/users`);
    return response.json();
  },

  // Get single user
  getById: async (id) => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/users/${id}`);
    return response.json();
  },

  // Create new user
  create: async (userData) => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  // Update user
  update: async (id, userData) => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  // Delete user
  delete: async (id) => {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/users/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};
