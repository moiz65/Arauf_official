const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const userId = req.params.userId || req.body.userId;
    const ext = path.extname(file.originalname);
    // Create unique filename: user_[userId]_[timestamp][extension]
    const filename = `user_${userId}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: fileFilter
});

// Helper function to delete old profile picture
const deleteOldProfilePicture = (filename) => {
  if (!filename) return;
  
  const filePath = path.join(__dirname, '../uploads/profile-pictures', filename);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log('Deleted old profile picture:', filename);
    } catch (error) {
      console.error('Error deleting old profile picture:', error);
    }
  }
};

module.exports = (db) => {
  // Upload/Update profile picture
  router.post('/upload/:userId', upload.single('profilePicture'), async (req, res) => {
    try {
      const userId = req.params.userId;
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }
      
      const filename = req.file.filename;
      
      // First, get the old profile picture filename
      const getOldPictureQuery = `
        SELECT profile_picture_url 
        FROM user_settings 
        WHERE user_id = ?
      `;
      
      db.query(getOldPictureQuery, [userId], (err, results) => {
        if (err) {
          console.error('Error checking old profile picture:', err);
          // Continue anyway - we'll update the database
        } else if (results && results.length > 0 && results[0].profile_picture_url) {
          // Extract filename from URL and delete old profile picture file
          const oldFilename = results[0].profile_picture_url.split('/').pop();
          deleteOldProfilePicture(oldFilename);
        }
        
        // Update database with new profile picture filename
        const updateQuery = `
          INSERT INTO user_settings (user_id, profile_picture_url)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE profile_picture_url = VALUES(profile_picture_url)
        `;
        
        db.query(updateQuery, [userId, filename], (updateErr) => {
          if (updateErr) {
            console.error('Error updating profile picture in database:', updateErr);
            
            // Delete uploaded file if database update fails
            deleteOldProfilePicture(filename);
            
            return res.status(500).json({ 
              success: false, 
              message: 'Error updating profile picture in database' 
            });
          }
          
          res.json({ 
            success: true, 
            message: 'Profile picture uploaded successfully',
            data: {
              filename: filename,
              profilePictureUrl: `/api/profile-picture/view/${filename}`
            }
          });
        });
      });
      
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Error uploading profile picture' 
      });
    }
  });
  
  // Get profile picture
  router.get('/view/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/profile-pictures', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile picture not found' 
      });
    }
    
    // Send file
    res.sendFile(filePath);
  });
  
  // Get user's current profile picture filename
  router.get('/user/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = `
      SELECT profile_picture_url 
      FROM user_settings 
      WHERE user_id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching profile picture:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching profile picture' 
        });
      }
      
      if (!results || results.length === 0 || !results[0].profile_picture_url) {
        return res.json({ 
          success: true, 
          profilePicture: null,
          url: null
        });
      }
      
      const filename = results[0].profile_picture_url;
      res.json({ 
        success: true, 
        profilePicture: filename,
        url: `/api/profile-picture/view/${filename}`
      });
    });
  });
  
  // Delete profile picture
  router.delete('/delete/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // Get current profile picture
    const getQuery = `
      SELECT profile_picture_url 
      FROM user_settings 
      WHERE user_id = ?
    `;
    
    db.query(getQuery, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching profile picture:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching profile picture' 
        });
      }
      
      if (!results || results.length === 0 || !results[0].profile_picture_url) {
        return res.json({ 
          success: true, 
          message: 'No profile picture to delete' 
        });
      }
      
      const filename = results[0].profile_picture_url;
      
      // Delete file
      deleteOldProfilePicture(filename);
      
      // Update database
      const updateQuery = `
        UPDATE user_settings 
        SET profile_picture_url = NULL 
        WHERE user_id = ?
      `;
      
      db.query(updateQuery, [userId], (updateErr) => {
        if (updateErr) {
          console.error('Error removing profile picture from database:', updateErr);
          return res.status(500).json({ 
            success: false, 
            message: 'Error removing profile picture from database' 
          });
        }
        
        res.json({ 
          success: true, 
          message: 'Profile picture deleted successfully' 
        });
      });
    });
  });
  
  return router;
};
