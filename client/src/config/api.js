// API Configuration - Centralized endpoint management
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const AUTH_BASE_URL = process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:5000';

// API Endpoints
const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${AUTH_BASE_URL}/login`,
    SIGNUP: `${AUTH_BASE_URL}/signup`,
  },

  // Customers
  CUSTOMERS: {
    LIST: `${API_BASE_URL}/v1/customertable`,
    GET: (id) => `${API_BASE_URL}/v1/customertable/${id}`,
    CREATE: `${API_BASE_URL}/v1/customertable`,
    UPDATE: (id) => `${API_BASE_URL}/v1/customertable/${id}`,
    DELETE: (id) => `${API_BASE_URL}/v1/customertable/${id}`,
  },

  // Invoices
  INVOICES: {
    LIST: `${API_BASE_URL}/invoices`,
    CREATE: `${API_BASE_URL}/invoices`,
    GET: (id) => `${API_BASE_URL}/invoices/${id}`,
  },

  // Categories
  CATEGORIES: {
    LIST: (type) => `${API_BASE_URL}/categories${type ? `?type=${type}` : ''}`,
  },

  // Stock
  STOCK: {
    LIST: `${API_BASE_URL}/stock`,
    CREATE: `${API_BASE_URL}/stock`,
    UPDATE: (id) => `${API_BASE_URL}/stock/${id}`,
    DELETE: (id) => `${API_BASE_URL}/stock/${id}`,
  },

  // Purchase Orders
  PURCHASE_ORDERS: {
    LIST: `${API_BASE_URL}/purchase-orders`,
    GET: (id) => `${API_BASE_URL}/purchase-orders/${id}`,
    INVOICES: (number) => `${API_BASE_URL}/purchase-orders/${number}/invoices`,
    SUMMARY: (id) => `${API_BASE_URL}/purchase-orders/${id}/summary`,
  },

  // Financial Reports
  FINANCIAL_REPORTS: {
    CONTACT_BALANCES: `${API_BASE_URL}/financial-reports/contact-balances`,
    STORAGE_LIST: `${API_BASE_URL}/financial-reports-storage`,
    STORAGE_GET: (id) => `${API_BASE_URL}/financial-reports-storage/${id}`,
    GENERATE: `${API_BASE_URL}/financial-reports-storage/generate`,
  },

  // Dashboard
  DASHBOARD: {
    MONTHLY_FINANCIALS: `${API_BASE_URL}/dashboard/monthly-financials`,
  },

  // Settings
  SETTINGS: {
    COMPANY: `${API_BASE_URL}/company-settings`,
    USER: (userId) => `${API_BASE_URL}/settings/${userId}`,
    UPLOAD_PROFILE: (userId) => `${API_BASE_URL}/profile-picture/upload/${userId}`,
  },

  // Users
  USERS: {
    LIST: `${API_BASE_URL}/users`,
    GET: (id) => `${API_BASE_URL}/users/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/users/${id}`,
    DELETE: (id) => `${API_BASE_URL}/users/${id}`,
    MODULES: (userId) => `${API_BASE_URL}/user-modules/${userId}`,
  },

  // Expenses
  EXPENSES: {
    LIST: `${API_BASE_URL}/expenses`,
    GET: (id) => `${API_BASE_URL}/expenses/${id}`,
    CREATE: `${API_BASE_URL}/expenses`,
    UPDATE: (id) => `${API_BASE_URL}/expenses/${id}`,
  },

  // Financial Years
  FINANCIAL_YEARS: {
    LIST: `${API_BASE_URL}/financial-years`,
    GET: (customerId) => `${API_BASE_URL}/financial-years/${customerId}`,
    CREATE: `${API_BASE_URL}/financial-years`,
    CLOSE: (id) => `${API_BASE_URL}/financial-years/${id}/close`,
  },

  // Reports
  REPORTS: {
    LIST: `${API_BASE_URL}/v1/reports`,
    GET: (id) => `${API_BASE_URL}/v1/reports/${id}`,
    DELETE: (id) => `${API_BASE_URL}/v1/reports/${id}`,
    STATS: `${API_BASE_URL}/v1/reports/stats`,
    SUGGESTIONS: (q) => `${API_BASE_URL}/v1/customers/suggestions?q=${encodeURIComponent(q)}`,
  },

  // Purchase Orders
  PURCHASE_ORDERS: {
    LIST: `${API_BASE_URL}/purchase-orders`,
    GET: (id) => `${API_BASE_URL}/purchase-orders/${id}`,
    INVOICES: (number) => `${API_BASE_URL}/purchase-orders/${number}/invoices`,
    SUMMARY: `${API_BASE_URL}/po-summaries`,
  },

  // Customers
  CUSTOMERS: {
    LIST: `${API_BASE_URL}/v1/customertable`,
    GET: (id) => `${API_BASE_URL}/v1/customertable/${id}`,
  },
};

// Helper function to build full URLs with proper domain
const getFullUrl = (endpoint) => {
  // If endpoint already includes http, return as-is
  if (endpoint.startsWith('http')) return endpoint;
  
  // If endpoint is relative path (starts with /), prepend AUTH_BASE_URL without /api
  if (endpoint.startsWith('/')) {
    const baseUrl = AUTH_BASE_URL || process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}${endpoint}`;
  }
  
  // Otherwise assume it's an API endpoint
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

export { API_BASE_URL, AUTH_BASE_URL, API_ENDPOINTS, getFullUrl };
