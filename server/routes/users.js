const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'user-profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = (db) => {
  // Get all users with their roles
  router.get('/', (req, res) => {
    const query = `
      SELECT 
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.password,
        u.role_id,
        u.company,
        u.profile_picture_url,
        r.name as role_name,
        r.description as role_description,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch users',
          error: err.message 
        });
      }
      
      res.json({ 
        success: true, 
        data: results 
      });
    });
  });

  // Get single user by ID
  router.get('/:id', (req, res) => {
    const { id } = req.params;
    const query = `
      SELECT 
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.password,
        u.role_id,
        u.company,
        u.profile_picture_url,
        r.name as role_name,
        r.description as role_description,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch user',
          error: err.message 
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      res.json({ 
        success: true, 
        data: results[0] 
      });
    });
  });

  // Create new user with optional profile picture
  router.post('/', upload.single('profilePicture'), (req, res) => {
    const { firstName, lastName, email, phone, password, role, company } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, email, and password are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Get profile picture URL from Cloudinary upload
    const profilePictureUrl = req.file ? req.file.path : null;

    // Check if email already exists
    const checkQuery = 'SELECT id FROM users WHERE email = ?';
    db.query(checkQuery, [email], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Error checking email:', checkErr);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to validate email',
          error: checkErr.message 
        });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'Email already exists' 
        });
      }

      // Get role_id from role name
      let roleId = null;
      if (role) {
        const getRoleQuery = 'SELECT id FROM roles WHERE LOWER(name) = LOWER(?)';
        db.query(getRoleQuery, [role], (roleErr, roleResults) => {
          if (roleErr) {
            console.error('Error fetching role:', roleErr);
            return res.status(500).json({ 
              success: false, 
              message: 'Failed to validate role',
              error: roleErr.message 
            });
          }

          if (roleResults.length === 0) {
            console.error(`Role not found: "${role}". Available roles should be queried.`);
            return res.status(400).json({ 
              success: false, 
              message: `Role "${role}" does not exist. Please select a valid role.`
            });
          }

          roleId = roleResults[0].id;
          insertUser(roleId);
        });
      } else {
        insertUser(null);
      }

      function insertUser(roleId) {
        // Insert user (store plain-text password as requested)
        const insertQuery = `
          INSERT INTO users (firstName, lastName, email, phone, password, role_id, company, profile_picture_url) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(
          insertQuery, 
          [firstName, lastName, email, phone || null, password, roleId, company || null, profilePictureUrl],
          (err, result) => {
            if (err) {
              console.error('Error creating user:', err);
              return res.status(500).json({ 
                success: false, 
                message: 'Failed to create user',
                error: err.message 
              });
            }
            
            res.status(201).json({ 
              success: true, 
              message: 'User created successfully',
              data: {
                id: result.insertId,
                firstName,
                lastName,
                email,
                phone: phone || null,
                role_id: roleId,
                company: company || null,
                profile_picture_url: profilePictureUrl
              }
            });
          }
        );
      }
    });
  });

  // Update user with optional profile picture
  router.put('/:id', upload.single('profilePicture'), (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role, company } = req.body;

    // Get profile picture URL from Cloudinary upload if provided
    const profilePictureUrl = req.file ? req.file.path : undefined;

    // Check if user exists
    const checkQuery = 'SELECT id FROM users WHERE id = ?';
    db.query(checkQuery, [id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Error checking user:', checkErr);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to validate user',
          error: checkErr.message 
        });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Check email uniqueness if email is being updated
      if (email) {
        const emailCheck = 'SELECT id FROM users WHERE email = ? AND id != ?';
        db.query(emailCheck, [email, id], (emailErr, emailResults) => {
          if (emailErr) {
            console.error('Error checking email:', emailErr);
            return res.status(500).json({ 
              success: false, 
              message: 'Failed to validate email',
              error: emailErr.message 
            });
          }

          if (emailResults.length > 0) {
            return res.status(409).json({ 
              success: false, 
              message: 'Email already in use by another user' 
            });
          }

          proceedWithUpdate();
        });
      } else {
        proceedWithUpdate();
      }

      function proceedWithUpdate() {
        // Get role_id from role name if provided
        if (role) {
          const getRoleQuery = 'SELECT id FROM roles WHERE LOWER(name) = LOWER(?)';
          db.query(getRoleQuery, [role], (roleErr, roleResults) => {
            if (roleErr) {
              console.error('Error fetching role:', roleErr);
              return res.status(500).json({ 
                success: false, 
                message: 'Failed to validate role',
                error: roleErr.message 
              });
            }

            const roleId = roleResults.length > 0 ? roleResults[0].id : null;
            updateUser(roleId);
          });
        } else {
          updateUser(null);
        }
      }

      function updateUser(roleId) {
        // Build dynamic update query
        const updates = [];
        const values = [];

        if (firstName) {
          updates.push('firstName = ?');
          values.push(firstName);
        }
        if (lastName) {
          updates.push('lastName = ?');
          values.push(lastName);
        }
        if (email) {
          updates.push('email = ?');
          values.push(email);
        }
        if (phone !== undefined) {
          updates.push('phone = ?');
          values.push(phone || null);
        }
        if (roleId !== null) {
          updates.push('role_id = ?');
          values.push(roleId);
        }
        if (company !== undefined) {
          updates.push('company = ?');
          values.push(company || null);
        }
        if (profilePictureUrl !== undefined) {
          updates.push('profile_picture_url = ?');
          values.push(profilePictureUrl);
        }

        // Handle password update (store plain-text password as requested)
        if (req.body.password && req.body.password.trim() !== '') {
          updates.push('password = ?');
          values.push(req.body.password);
        }

        if (updates.length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'No fields to update' 
          });
        }

        values.push(id);
        const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

        db.query(updateQuery, values, (err) => {
          if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Failed to update user',
              error: err.message 
            });
          }
          
          res.json({ 
            success: true, 
            message: 'User updated successfully' 
          });
        });
      }
    });
  });

  // Delete user
  router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Check if user exists and get admin user info
    const checkQuery = 'SELECT u.id, u.email, u.role_id, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?';
    db.query(checkQuery, [id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Error checking user:', checkErr);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to validate user',
          error: checkErr.message 
        });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Prevent deletion of system admin user (email: admin@digious.com)
      if (checkResults[0].email === 'admin@digious.com') {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot delete the System Admin user. At least one system admin must exist.' 
        });
      }

      // Delete user
      const deleteQuery = 'DELETE FROM users WHERE id = ?';
      db.query(deleteQuery, [id], (err) => {
        if (err) {
          console.error('Error deleting user:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to delete user',
            error: err.message 
          });
        }
        
        res.json({ 
          success: true, 
          message: 'User deleted successfully' 
        });
      });
    });
  });

  return router;
};

module.exports = module.exports;
