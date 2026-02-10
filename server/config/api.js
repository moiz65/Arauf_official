// Server Configuration - Centralized endpoint and setting management
const getConfig = () => {
  return {
    SERVER: {
      PORT: process.env.PORT || 5000,
      NODE_ENV: process.env.NODE_ENV || 'development',
      DEV_VERBOSE: process.env.DEV_VERBOSE === 'true',
    },

    DATABASE: {
      HOST: process.env.DB_HOST || 'localhost',
      USER: process.env.DB_USER || 'root',
      PASSWORD: process.env.DB_PASSWORD || '',
      NAME: process.env.DB_NAME || 'arauf_crm',
      PORT: process.env.DB_PORT || 3306,
    },

    JWT: {
      SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
    },

    UPLOAD: {
      DIR: process.env.UPLOAD_DIR || './uploads',
    },

    CORS: {
      ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    },

    API_ROUTES: {
      PREFIX: '/api',
      AUTH: '/auth',
      USERS: '/users',
      CATEGORIES: '/categories',
      CUSTOMERS: '/v1/customertable',
      INVOICES: '/invoices',
      STOCK: '/stock',
      PURCHASE_ORDERS: '/purchase-orders',
      FINANCIAL_REPORTS: '/financial-reports',
      FINANCIAL_REPORTS_STORAGE: '/financial-reports-storage',
      DASHBOARD: '/dashboard',
      SETTINGS: '/settings',
      ROLES: '/roles',
      LEDGER: '/ledger',
      LEDGER_ENTRIES: '/ledger-entries',
      PROFILE_PICTURE: '/profile-picture',
    },
  };
};

module.exports = { getConfig };
