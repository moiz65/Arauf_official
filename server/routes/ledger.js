const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // Basic health endpoint for ledger
  router.get('/', (req, res) => {
    return res.json({ success: true, message: 'Ledger routes active' });
  });

  // Get ledger entries for a specific customerId
  router.get('/:customerId', (req, res) => {
    const { customerId } = req.params;

    // Attempt to read from 'ledger' table if it exists.
    const query = 'SELECT * FROM ledger WHERE customer_id = ? ORDER BY date ASC';
    db.query(query, [customerId], (err, results) => {
      if (err) {
        // If the ledger table does not exist, return a friendly empty response
        if (err.code === 'ER_NO_SUCH_TABLE') {
          return res.json([]);
        }
        console.error('Error querying ledger:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch ledger entries', error: err.message });
      }

      return res.json(results || []);
    });
  });

  // Add a ledger entry (safe best-effort: will return error if table missing)
  router.post('/add', (req, res) => {
    const entry = req.body || {};

    // basic validation
    if (!entry.customer_id || !entry.date) {
      return res.status(400).json({ success: false, message: 'customer_id and date are required' });
    }

    const insertQuery = `
      INSERT INTO ledger (
        customer_id, date, particulars, description, mtr, rate, bill_no,
        cash, online, cheque, cheque_no, debit, credit, balance, days, due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      entry.customer_id,
      entry.date,
      entry.particulars || null,
      entry.description || null,
      entry.mtr || null,
      entry.rate || null,
      entry.bill_no || null,
      entry.cash || 0,
      entry.online || 0,
      entry.cheque || 0,
      entry.cheque_no || null,
      entry.debit || 0,
      entry.credit || 0,
      entry.balance || 0,
      entry.days || null,
      entry.due_date || null
    ];

    db.query(insertQuery, params, (err, result) => {
      if (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          return res.status(500).json({ success: false, message: 'Ledger table does not exist on server' });
        }
        console.error('Error inserting ledger entry:', err);
        return res.status(500).json({ success: false, message: 'Failed to add ledger entry', error: err.message });
      }

      res.status(201).json({ success: true, insertId: result.insertId });
    });
  });

  return router;
};
