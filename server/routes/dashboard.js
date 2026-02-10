const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

// Dashboard summary with all key metrics
router.get('/summary', DashboardController.getDashboardSummary);

// Monthly expenses for chart
router.get('/monthly-expenses', DashboardController.getMonthlyExpenses);

// Monthly financials (revenue vs expenses)
router.get('/monthly-financials', (req, res) => {
  // Return sample data for monthly financials - frontend has fallback
  const sampleMonthly = [
    { month: 'Jan', revenue: 120000, expenses: 90000 },
    { month: 'Feb', revenue: 150000, expenses: 110000 },
    { month: 'Mar', revenue: 140000, expenses: 95000 },
    { month: 'Apr', revenue: 180000, expenses: 120000 },
    { month: 'May', revenue: 200000, expenses: 145000 },
    { month: 'Jun', revenue: 220000, expenses: 160000 },
    { month: 'Jul', revenue: 210000, expenses: 180000 },
    { month: 'Aug', revenue: 230000, expenses: 170000 },
    { month: 'Sep', revenue: 240000, expenses: 200000 },
    { month: 'Oct', revenue: 260000, expenses: 215000 },
    { month: 'Nov', revenue: 280000, expenses: 225000 },
    { month: 'Dec', revenue: 300000, expenses: 250000 }
  ];
  
  res.json({
    success: true,
    data: sampleMonthly
  });
});

// Transaction history - also add this to main transaction-history endpoint for compatibility
router.get('/transactions', DashboardController.getTransactionHistory);

module.exports = router;