// Stock Management Routes
const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // GET - Fetch all stock items
  router.get('/', async (req, res) => {
    try {
      const query = `
        SELECT * FROM stock 
        ORDER BY created_at DESC
      `;
      
      db.query(query, (err, results) => {
        if (err) {
          console.error('Error fetching stocks:', err);
          return res.status(500).json({ message: 'Error fetching stocks', error: err.message });
        }
        res.json(results || []);
      });
    } catch (error) {
      console.error('Error in GET /api/stock:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  // GET - Fetch stock by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const query = 'SELECT * FROM stock WHERE id = ?';
      
      db.query(query, [id], (err, results) => {
        if (err) {
          console.error('Error fetching stock:', err);
          return res.status(500).json({ message: 'Error fetching stock', error: err.message });
        }
        
        if (results.length === 0) {
          return res.status(404).json({ message: 'Stock item not found' });
        }
        
        res.json(results[0]);
      });
    } catch (error) {
      console.error('Error in GET /api/stock/:id:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  // POST - Create new stock item
  router.post('/', async (req, res) => {
    try {
      const {
        item_name,
        category,
        quantity,
        unit,
        price_per_unit,
        supplier_name,
        supplier_email,
        supplier_phone,
        purchase_date,
        expiry_date,
        location,
        description,
        status
      } = req.body;

      // Validation
      if (!item_name || !quantity) {
        return res.status(400).json({ message: 'Item name and quantity are required' });
      }

      const query = `
        INSERT INTO stock (
          item_name,
          category,
          quantity,
          unit,
          price_per_unit,
          supplier_name,
          supplier_email,
          supplier_phone,
          purchase_date,
          expiry_date,
          location,
          description,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const values = [
        item_name,
        category || null,
        quantity,
        unit || 'KG',
        price_per_unit || 0,
        supplier_name || null,
        supplier_email || null,
        supplier_phone || null,
        purchase_date || null,
        expiry_date || null,
        location || null,
        description || null,
        status || 'Active'
      ];

      db.query(query, values, (err, result) => {
        if (err) {
          console.error('Error creating stock:', err);
          return res.status(500).json({ message: 'Error creating stock', error: err.message });
        }
        
        res.status(201).json({
          message: 'Stock item created successfully',
          id: result.insertId
        });
      });
    } catch (error) {
      console.error('Error in POST /api/stock:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  // PUT - Update stock item
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const {
        item_name,
        category,
        quantity,
        unit,
        price_per_unit,
        supplier_name,
        supplier_email,
        supplier_phone,
        purchase_date,
        expiry_date,
        location,
        description,
        status
      } = req.body;

      // Validation
      if (!item_name || quantity === undefined) {
        return res.status(400).json({ message: 'Item name and quantity are required' });
      }

      const query = `
        UPDATE stock SET
          item_name = ?,
          category = ?,
          quantity = ?,
          unit = ?,
          price_per_unit = ?,
          supplier_name = ?,
          supplier_email = ?,
          supplier_phone = ?,
          purchase_date = ?,
          expiry_date = ?,
          location = ?,
          description = ?,
          status = ?,
          updated_at = NOW()
        WHERE id = ?
      `;

      const values = [
        item_name,
        category || null,
        quantity,
        unit || 'KG',
        price_per_unit || 0,
        supplier_name || null,
        supplier_email || null,
        supplier_phone || null,
        purchase_date || null,
        expiry_date || null,
        location || null,
        description || null,
        status || 'Active',
        id
      ];

      db.query(query, values, (err, result) => {
        if (err) {
          console.error('Error updating stock:', err);
          return res.status(500).json({ message: 'Error updating stock', error: err.message });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Stock item not found' });
        }
        
        res.json({ message: 'Stock item updated successfully' });
      });
    } catch (error) {
      console.error('Error in PUT /api/stock/:id:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  // DELETE - Remove stock item
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const query = 'DELETE FROM stock WHERE id = ?';
      
      db.query(query, [id], (err, result) => {
        if (err) {
          console.error('Error deleting stock:', err);
          return res.status(500).json({ message: 'Error deleting stock', error: err.message });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Stock item not found' });
        }
        
        res.json({ message: 'Stock item deleted successfully' });
      });
    } catch (error) {
      console.error('Error in DELETE /api/stock/:id:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  // GET - Stock statistics
  router.get('/stats/overview', async (req, res) => {
    try {
      const query = `
        SELECT
          COUNT(DISTINCT id) as total_items,
          COUNT(DISTINCT category) as total_categories,
          SUM(quantity) as total_quantity,
          SUM(quantity * price_per_unit) as total_value,
          MAX(created_at) as last_updated
        FROM stock
      `;
      
      db.query(query, (err, results) => {
        if (err) {
          console.error('Error fetching stock stats:', err);
          return res.status(500).json({ message: 'Error fetching stats', error: err.message });
        }
        res.json(results[0] || {});
      });
    } catch (error) {
      console.error('Error in GET /api/stock/stats/overview:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  return router;
};
