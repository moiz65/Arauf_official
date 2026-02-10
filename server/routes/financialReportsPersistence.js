const express = require('express');
const router = express.Router();
const db = require('../src/config/db');

// Generate and save a new financial report
router.post('/generate', async (req, res) => {
  let connection;
  try {
    const {
      reportId,
      shortId,
      description,
      rangeType,
      startDate,
      endDate,
      totalDebit,
      totalCredit,
      contacts,
      generatedBy
    } = req.body;

    if (!reportId || !shortId) {
      return res.status(400).json({ error: 'reportId and shortId are required' });
    }

    connection = await db.getConnection();
    
    const totalBalance = totalDebit - totalCredit;

    const [result] = await connection.query(
      `INSERT INTO financial_reports 
      (report_id, short_id, description, range_type, start_date, end_date, total_debit, total_credit, total_balance, contact_count, generated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportId,
        shortId,
        description || 'A-Rauf Financial Report',
        rangeType || 'all',
        startDate || null,
        endDate || null,
        totalDebit || 0,
        totalCredit || 0,
        totalBalance,
        contacts?.length || 0,
        generatedBy || 'system'
      ]
    );

    const reportDbId = result.insertId;

    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
      for (const contact of contacts) {
        await connection.query(
          `INSERT INTO financial_report_details 
          (report_id, customer_id, customer_name, company_name, email, phone, debit_amount, credit_amount, balance)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reportDbId,
            contact.id || null,
            contact.contact || null,
            contact.name || null,
            contact.email || null,
            contact.phone || null,
            contact.debit || 0,
            contact.credit || 0,
            (contact.debit || 0) - (contact.credit || 0)
          ]
        );
      }
    }

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Report saved successfully',
      data: {
        id: reportDbId,
        reportId,
        shortId
      }
    });
  } catch (error) {
    if (connection) connection.release();
    console.error('Error saving report:', error);
    res.status(500).json({ error: error.message || 'Failed to save report' });
  }
});

// Get all financial reports
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    
    const [reports] = await connection.query(
      `SELECT * FROM financial_reports ORDER BY generated_at DESC LIMIT 50`
    );

    connection.release();

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch reports' });
  }
});

// Get a specific report with details
router.get('/:reportId', async (req, res) => {
  let connection;
  try {
    const { reportId } = req.params;
    connection = await db.getConnection();

    const [reports] = await connection.query(
      `SELECT * FROM financial_reports WHERE short_id = ? OR report_id = ?`,
      [reportId, reportId]
    );

    if (reports.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[0];

    const [details] = await connection.query(
      `SELECT * FROM financial_report_details WHERE report_id = ?`,
      [report.id]
    );

    connection.release();

    res.json({
      success: true,
      data: {
        ...report,
        contacts: details
      }
    });
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching report:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch report' });
  }
});

// Delete a report
router.delete('/:reportId', async (req, res) => {
  let connection;
  try {
    const { reportId } = req.params;
    connection = await db.getConnection();

    const [reports] = await connection.query(
      `SELECT id FROM financial_reports WHERE short_id = ? OR report_id = ?`,
      [reportId, reportId]
    );

    if (reports.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[0];

    await connection.query(
      `DELETE FROM financial_reports WHERE id = ?`,
      [report.id]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    if (connection) connection.release();
    console.error('Error deleting report:', error);
    res.status(500).json({ error: error.message || 'Failed to delete report' });
  }
});

module.exports = router;
