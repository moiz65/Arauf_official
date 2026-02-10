const express = require('express');
const router = express.Router();
const db = require('../src/config/db');

/**
 * GET /api/financial-reports/contact-balances
 * Fetch contact-wise financial balances (debit, credit, balance)
 * Query params:
 *  - range: '3m', '6m', '1y', 'all', 'custom'
 *  - startDate: YYYY-MM-DD (for custom range)
 *  - endDate: YYYY-MM-DD (for custom range)
 */
router.get('/contact-balances', async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    
    let whereClause = '';
    let queryParams = [];

    // Build WHERE clause based on range - only include customers with transactions in the range
    if (range === 'custom' && startDate && endDate) {
      whereClause = 'WHERE le.entry_date BETWEEN ? AND ?';
      queryParams = [startDate, endDate];
    } else if (range === '3m') {
      whereClause = 'WHERE le.entry_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
    } else if (range === '6m') {
      whereClause = 'WHERE le.entry_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
    } else if (range === '1y') {
      whereClause = 'WHERE le.entry_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
    }
    // If 'all' or no range, no date filter (but still require entries to exist)

    const query = `
      SELECT 
        c.customer_id,
        c.customer as contact_name,
        c.company as company_name,
        c.email,
        c.phone,
        COALESCE(SUM(le.debit_amount), 0) as total_debit,
        COALESCE(SUM(le.credit_amount), 0) as total_credit,
        COALESCE(SUM(le.debit_amount) - SUM(le.credit_amount), 0) as balance
      FROM ledger_entries le
      INNER JOIN customertable c ON le.customer_id = c.customer_id
      ${whereClause}
      GROUP BY c.customer_id, c.customer, c.company, c.email, c.phone
      HAVING total_debit > 0 OR total_credit > 0
      ORDER BY c.customer ASC
    `;

    const [results] = await db.query(query, queryParams);

    // Calculate totals
    const totals = results.reduce((acc, row) => {
      acc.debit += Number(row.total_debit || 0);
      acc.credit += Number(row.total_credit || 0);
      acc.balance += Number(row.balance || 0);
      return acc;
    }, { debit: 0, credit: 0, balance: 0 });

    res.json({
      success: true,
      data: {
        contacts: results,
        totals: totals
      }
    });
  } catch (error) {
    console.error('Error fetching financial report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial report data',
      message: error.message
    });
  }
});

/**
 * GET /api/financial-reports/summary
 * Fetch overall financial summary
 * Query params: same as above (range, startDate, endDate)
 */
router.get('/summary', async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    
    let dateFilter = '';
    let queryParams = [];

    if (range === 'custom' && startDate && endDate) {
      dateFilter = 'WHERE entry_date BETWEEN ? AND ?';
      queryParams = [startDate, endDate];
    } else if (range === '3m') {
      dateFilter = 'WHERE entry_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
    } else if (range === '6m') {
      dateFilter = 'WHERE entry_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
    } else if (range === '1y') {
      dateFilter = 'WHERE entry_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
    }

    const query = `
      SELECT 
        COALESCE(SUM(debit_amount), 0) as total_debit,
        COALESCE(SUM(credit_amount), 0) as total_credit,
        COALESCE(SUM(debit_amount) - SUM(credit_amount), 0) as net_balance,
        COUNT(DISTINCT customer_id) as total_customers,
        COUNT(*) as total_transactions
      FROM ledger_entries
      ${dateFilter}
    `;

    const [results] = await db.query(query, queryParams);

    res.json({
      success: true,
      data: results[0] || {
        total_debit: 0,
        total_credit: 0,
        net_balance: 0,
        total_customers: 0,
        total_transactions: 0
      }
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary data',
      message: error.message
    });
  }
});

module.exports = router;
