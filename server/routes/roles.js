const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get all roles
  router.get('/', (req, res) => {
    const query = `
      SELECT id, name, description, created_at, updated_at 
      FROM roles 
      ORDER BY name ASC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching roles:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch roles',
          error: err.message 
        });
      }
      
      res.json({ 
        success: true, 
        data: results 
      });
    });
  });

  // Get single role by ID
  router.get('/:id', (req, res) => {
    const { id } = req.params;
    const query = `
      SELECT id, name, description, created_at, updated_at 
      FROM roles 
      WHERE id = ?
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error fetching role:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch role',
          error: err.message 
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Role not found' 
        });
      }
      
      res.json({ 
        success: true, 
        data: results[0] 
      });
    });
  });

  // Create new role
  router.post('/', (req, res) => {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role name is required' 
      });
    }

    // Check if role name already exists
    const checkQuery = 'SELECT id FROM roles WHERE name = ?';
    db.query(checkQuery, [name.trim()], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Error checking role existence:', checkErr);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to validate role',
          error: checkErr.message 
        });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'Role name already exists' 
        });
      }

      // Insert new role
      const insertQuery = `
        INSERT INTO roles (name, description) 
        VALUES (?, ?)
      `;
      
      db.query(insertQuery, [name.trim(), description || ''], (err, result) => {
        if (err) {
          console.error('Error creating role:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to create role',
            error: err.message 
          });
        }
        
        res.status(201).json({ 
          success: true, 
          message: 'Role created successfully',
          data: {
            id: result.insertId,
            name: name.trim(),
            description: description || ''
          }
        });
      });
    });
  });

  // Update role
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role name is required' 
      });
    }

    // Check if role exists
    const checkQuery = 'SELECT id, name FROM roles WHERE id = ?';
    db.query(checkQuery, [id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Error checking role:', checkErr);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to validate role',
          error: checkErr.message 
        });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Role not found' 
        });
      }

      // Prevent editing of Admin role
      if (checkResults[0].name === 'Admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot edit Admin role. The Admin role is protected and cannot be modified.' 
        });
      }

      // Check if new name conflicts with existing role
      const conflictQuery = 'SELECT id FROM roles WHERE name = ? AND id != ?';
      db.query(conflictQuery, [name.trim(), id], (conflictErr, conflictResults) => {
        if (conflictErr) {
          console.error('Error checking name conflict:', conflictErr);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to validate role name',
            error: conflictErr.message 
          });
        }

        if (conflictResults.length > 0) {
          return res.status(409).json({ 
            success: false, 
            message: 'Role name already exists' 
          });
        }

        // Update role
        const updateQuery = 'UPDATE roles SET name = ?, description = ? WHERE id = ?';
        db.query(updateQuery, [name.trim(), description || '', id], (err) => {
          if (err) {
            console.error('Error updating role:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Failed to update role',
              error: err.message 
            });
          }
          
          res.json({ 
            success: true, 
            message: 'Role updated successfully'
          });
        });
      });
    });
  });

  // Delete role
  router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Check if role exists and get role name
    const checkQuery = 'SELECT id, name FROM roles WHERE id = ?';
    db.query(checkQuery, [id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Error checking role:', checkErr);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to validate role',
          error: checkErr.message 
        });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Role not found' 
        });
      }

      // Prevent deletion of Admin role
      if (checkResults[0].name === 'Admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot delete Admin role. The Admin role is protected and cannot be deleted.' 
        });
      }

      // Check if any users are assigned to this role
      const userCheckQuery = 'SELECT COUNT(*) as user_count FROM users WHERE role_id = ?';
      db.query(userCheckQuery, [id], (userErr, userResults) => {
        if (userErr) {
          console.error('Error checking user assignments:', userErr);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to validate role usage',
            error: userErr.message 
          });
        }

        if (userResults[0].user_count > 0) {
          return res.status(409).json({ 
            success: false, 
            message: `Cannot delete role. ${userResults[0].user_count} user(s) are assigned to this role.`,
            userCount: userResults[0].user_count
          });
        }

        // Delete role (privileges will be cascade deleted)
        const deleteQuery = 'DELETE FROM roles WHERE id = ?';
        db.query(deleteQuery, [id], (err) => {
          if (err) {
            console.error('Error deleting role:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Failed to delete role',
              error: err.message 
            });
          }
          
          res.json({ 
            success: true, 
            message: 'Role deleted successfully' 
          });
        });
      });
    });
  });

  // Get modules accessible to a specific role
  router.get('/:id/modules', (req, res) => {
    const { id } = req.params;
    
    const query = `
      SELECT module 
      FROM role_modules 
      WHERE role_id = ?
      ORDER BY module ASC
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error fetching modules:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch modules',
          error: err.message 
        });
      }
      
      // Convert to array of module names
      const modules = results.map(row => row.module);
      
      res.json({ 
        success: true, 
        data: modules 
      });
    });
  });

  // Update modules for a specific role (simplified: just module names, no granular CRUD)
  router.put('/:id/modules', (req, res) => {
    const { id } = req.params;
    const { modules } = req.body;

    if (!Array.isArray(modules)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Modules must be an array' 
      });
    }

    // Check if role exists
    const checkQuery = 'SELECT id FROM roles WHERE id = ?';
    db.query(checkQuery, [id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Error checking role:', checkErr);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to validate role',
          error: checkErr.message 
        });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Role not found' 
        });
      }

      // Delete existing modules for this role
      const deleteQuery = 'DELETE FROM role_modules WHERE role_id = ?';
      db.query(deleteQuery, [id], (deleteErr) => {
        if (deleteErr) {
          console.error('Error deleting old modules:', deleteErr);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to update modules',
            error: deleteErr.message 
          });
        }

        // Insert new modules
        if (modules.length === 0) {
          // Role has no module access
          return res.json({ 
            success: true, 
            message: 'Modules updated successfully (no access)' 
          });
        }

        const insertPromises = [];
        modules.forEach(module => {
          const insertQuery = `
            INSERT INTO role_modules (role_id, module) 
            VALUES (?, ?)
          `;
          insertPromises.push(
            new Promise((resolve, reject) => {
              db.query(
                insertQuery, 
                [id, module], 
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            })
          );
        });

        Promise.all(insertPromises)
          .then(() => {
            res.json({ 
              success: true, 
              message: 'Modules updated successfully' 
            });
          })
          .catch((err) => {
            console.error('Error inserting modules:', err);
            res.status(500).json({ 
              success: false, 
              message: 'Failed to save modules',
              error: err.message 
            });
          });
      });
    });
  });

  return router;
};

module.exports = module.exports;
