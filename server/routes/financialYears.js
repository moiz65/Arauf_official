const express = require('express');
const router = express.Router();
const db = require('../src/config/db');

// ============ FINANCIAL YEAR MANAGEMENT ============

/**
 * Initialize financial year tables if they don't exist
 */
const initializeTables = async () => {
  try {
    // Create ledger_financial_years table
    const fy_table = `
      CREATE TABLE IF NOT EXISTS ledger_financial_years (
        fy_id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        fy_name VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        opening_debit DECIMAL(15, 2) DEFAULT 0.00,
        opening_credit DECIMAL(15, 2) DEFAULT 0.00,
        opening_balance DECIMAL(15, 2) DEFAULT 0.00,
        closing_debit DECIMAL(15, 2) DEFAULT 0.00,
        closing_credit DECIMAL(15, 2) DEFAULT 0.00,
        closing_balance DECIMAL(15, 2) DEFAULT 0.00,
        status ENUM('open', 'closed', 'archived') DEFAULT 'open',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customertable(customer_id) ON DELETE CASCADE,
        INDEX idx_customer_fy (customer_id, start_date),
        UNIQUE KEY unique_fy_period (customer_id, start_date, end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await db.query(fy_table);
    console.log('[FY Init] ledger_financial_years table ready');

    // Create ledger_fy_closing_balance table
    const closing_table = `
      CREATE TABLE IF NOT EXISTS ledger_fy_closing_balance (
        closing_id INT AUTO_INCREMENT PRIMARY KEY,
        fy_id INT NOT NULL,
        customer_id INT NOT NULL,
        closing_date DATE NOT NULL,
        closing_debit DECIMAL(15, 2) DEFAULT 0.00,
        closing_credit DECIMAL(15, 2) DEFAULT 0.00,
        closing_balance DECIMAL(15, 2) DEFAULT 0.00,
        pdf_file_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fy_id) REFERENCES ledger_financial_years(fy_id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customertable(customer_id) ON DELETE CASCADE,
        INDEX idx_customer_fy (customer_id, fy_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await db.query(closing_table);
    console.log('[FY Init] ledger_fy_closing_balance table ready');
  } catch (error) {
    console.error('[FY Init] Error initializing tables:', error);
  }
};

// Initialize tables on module load
initializeTables();

/**
 * GET - Get all financial years for a customer
 * GET /api/financial-years/:customer_id
 */
router.get('/:customer_id', async (req, res) => {
  try {
    const { customer_id } = req.params;
    console.log('[FY Route] Fetching FY for customer:', customer_id);

    const query = `
      SELECT 
        fy_id, customer_id, fy_name, start_date, end_date,
        opening_debit, opening_credit, opening_balance,
        closing_debit, closing_credit, closing_balance,
        status, notes, created_at, updated_at
      FROM ledger_financial_years
      WHERE customer_id = ?
      ORDER BY start_date DESC
    `;

    const [years] = await db.query(query, [customer_id]);
    console.log('[FY Route] Found years:', years ? years.length : 0);
    res.json(years || []);
  } catch (error) {
    console.error('[FY Route] Error fetching financial years:', error);
    res.status(500).json({ error: 'Failed to fetch financial years', details: error.message });
  }
});

/**
 * POST - Create a new financial year
 * POST /api/financial-years
 * Body: { customer_id, fy_name, start_date, end_date, opening_debit, opening_credit }
 */
router.post('/', async (req, res) => {
  try {
    const { customer_id, fy_name, start_date, end_date, opening_debit = 0, opening_credit = 0 } = req.body;

    // Validate inputs
    if (!customer_id || !fy_name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const opening_balance = opening_debit - opening_credit;

    const query = `
      INSERT INTO ledger_financial_years 
      (customer_id, fy_name, start_date, end_date, opening_debit, opening_credit, opening_balance, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
    `;

    const [result] = await db.query(query, [
      customer_id,
      fy_name,
      start_date,
      end_date,
      opening_debit,
      opening_credit,
      opening_balance
    ]);

    res.json({ 
      success: true, 
      fy_id: result.insertId,
      message: 'Financial year created successfully'
    });
  } catch (error) {
    console.error('Error creating financial year:', error);
    res.status(500).json({ error: 'Failed to create financial year' });
  }
});

/**
 * GET - Get specific financial year details
 * GET /api/financial-years/detail/:fy_id
 */
router.get('/detail/:fy_id', async (req, res) => {
  try {
    const { fy_id } = req.params;

    const query = `
      SELECT 
        lfy.*,
        c.customer AS customer_name,
        (SELECT COUNT(*) FROM ledger_entry_fy_mapping WHERE fy_id = lfy.fy_id) as entry_count,
        (SELECT COALESCE(SUM(debit_amount), 0) FROM ledger_entries le 
         INNER JOIN ledger_entry_fy_mapping lfm ON le.entry_id = lfm.entry_id 
         WHERE lfm.fy_id = lfy.fy_id) as total_debit,
        (SELECT COALESCE(SUM(credit_amount), 0) FROM ledger_entries le 
         INNER JOIN ledger_entry_fy_mapping lfm ON le.entry_id = lfm.entry_id 
         WHERE lfm.fy_id = lfy.fy_id) as total_credit
      FROM ledger_financial_years lfy
      LEFT JOIN customertable c ON lfy.customer_id = c.customer_id
      WHERE lfy.fy_id = ?
    `;

    const [result] = await db.query(query, [fy_id]);
    
    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Financial year not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching financial year details:', error);
    res.status(500).json({ error: 'Failed to fetch financial year details' });
  }
});

/**
 * PUT - Close a financial year and calculate closing balance
 * PUT /api/financial-years/:fy_id/close
 * Body: { closing_date }
 */
router.put('/:fy_id/close', async (req, res) => {
  try {
    const { fy_id } = req.params;
    const { closing_date } = req.body;

    // Get FY details
    const fyQuery = `SELECT * FROM ledger_financial_years WHERE fy_id = ?`;
    const [fyResult] = await db.query(fyQuery, [fy_id]);

    if (!fyResult || fyResult.length === 0) {
      return res.status(404).json({ error: 'Financial year not found' });
    }

    const fy = fyResult[0];

    // Calculate closing balance from entries in this FY
    const sumQuery = `
      SELECT 
        COALESCE(SUM(le.debit_amount), 0) as total_debit,
        COALESCE(SUM(le.credit_amount), 0) as total_credit
      FROM ledger_entries le
      INNER JOIN ledger_entry_fy_mapping lfm ON le.entry_id = lfm.entry_id
      WHERE lfm.fy_id = ?
    `;

    const [sumResult] = await db.query(sumQuery, [fy_id]);
    
  // sumResult values (and DECIMAL columns) may be returned as strings by mysql2.
  // Coerce all values to numbers to avoid string concatenation and NaN in SQL parameters.
  const total_debit_raw = sumResult[0]?.total_debit ?? 0;
  const total_credit_raw = sumResult[0]?.total_credit ?? 0;

  const opening_debit_num = Number(fy.opening_debit) || 0;
  const opening_credit_num = Number(fy.opening_credit) || 0;
  const total_debit_num = Number(total_debit_raw) || 0;
  const total_credit_num = Number(total_credit_raw) || 0;

  const closing_debit = opening_debit_num + total_debit_num;
  const closing_credit = opening_credit_num + total_credit_num;
  // Ensure closing_balance is a finite number and round to 2 decimals for storage
  let closing_balance = closing_debit - closing_credit;
  if (!Number.isFinite(closing_balance)) closing_balance = 0;
  closing_balance = Number(closing_balance.toFixed(2));

    // Update FY with closing balance
    const updateQuery = `
      UPDATE ledger_financial_years
      SET closing_debit = ?, closing_credit = ?, closing_balance = ?, status = 'closed', updated_at = NOW()
      WHERE fy_id = ?
    `;

    await db.query(updateQuery, [closing_debit, closing_credit, closing_balance, fy_id]);

    // Save closing balance history
    const historyQuery = `
      INSERT INTO ledger_fy_closing_balance
      (fy_id, customer_id, closing_date, closing_debit, closing_credit, closing_balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.query(historyQuery, [
      fy_id,
      fy.customer_id,
      closing_date || new Date(),
      closing_debit,
      closing_credit,
      closing_balance
    ]);

    res.json({
      success: true,
      message: 'Financial year closed successfully',
      closing_balance: {
        debit: closing_debit,
        credit: closing_credit,
        balance: closing_balance
      }
    });
  } catch (error) {
    console.error('Error closing financial year:', error);
    res.status(500).json({ error: 'Failed to close financial year' });
  }
});

/**
 * PUT - Update financial year details
 * PUT /api/financial-years/:fy_id
 */
router.put('/:fy_id', async (req, res) => {
  try {
    const { fy_id } = req.params;
    const { fy_name, notes, opening_debit, opening_credit } = req.body;

    const opening_balance = opening_debit - opening_credit;

    const query = `
      UPDATE ledger_financial_years
      SET fy_name = COALESCE(?, fy_name),
          notes = COALESCE(?, notes),
          opening_debit = COALESCE(?, opening_debit),
          opening_credit = COALESCE(?, opening_credit),
          opening_balance = COALESCE(?, opening_balance),
          updated_at = NOW()
      WHERE fy_id = ?
    `;

    await db.query(query, [fy_name, notes, opening_debit, opening_credit, opening_balance, fy_id]);

    res.json({ success: true, message: 'Financial year updated successfully' });
  } catch (error) {
    console.error('Error updating financial year:', error);
    res.status(500).json({ error: 'Failed to update financial year' });
  }
});

/**
 * DELETE - Archive/Delete a financial year
 * DELETE /api/financial-years/:fy_id
 */
router.delete('/:fy_id', async (req, res) => {
  try {
    const { fy_id } = req.params;

    // Soft delete - mark as archived
    const query = `UPDATE ledger_financial_years SET status = 'archived' WHERE fy_id = ?`;
    await db.query(query, [fy_id]);

    res.json({ success: true, message: 'Financial year archived successfully' });
  } catch (error) {
    console.error('Error deleting financial year:', error);
    res.status(500).json({ error: 'Failed to delete financial year' });
  }
});

/**
 * GET - Get closing balance history for a FY
 * GET /api/financial-years/:fy_id/closing-history
 */
router.get('/:fy_id/closing-history', async (req, res) => {
  try {
    const { fy_id } = req.params;

    const query = `
      SELECT *
      FROM ledger_fy_closing_balance
      WHERE fy_id = ?
      ORDER BY closing_date DESC
    `;

    const [history] = await db.query(query, [fy_id]);
    res.json(history || []);
  } catch (error) {
    console.error('Error fetching closing history:', error);
    res.status(500).json({ error: 'Failed to fetch closing history' });
  }
});

module.exports = router;
