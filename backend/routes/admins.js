const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/auth'); // We'll need authorizeRole
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const PROFILE_PICS_DIR = path.join(__dirname, '../uploads/profile_pictures');
if (!fs.existsSync(PROFILE_PICS_DIR)){
    fs.mkdirSync(PROFILE_PICS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, PROFILE_PICS_DIR);
  },
  filename: function (req, file, cb) {
    // Create a unique filename: adminId-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `admin-${req.params.adminId}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 1024 * 1024 * 2 }, // 2MB limit
  fileFilter: fileFilter
});

// GET /api/admins - List all admin users
// Protected by authentication and role authorization (only 'administrator' can access)
router.get('/', authenticateToken, authorizeRole(['administrator']), async (req, res, next) => {
  try {
    const result = await db.query('SELECT id, username, role, profile_image_url, created_at, updated_at FROM admins ORDER BY username');
    res.json(result.rows);
  } catch (err) {
    next(err); // Pass errors to the global error handler
  }
});

// POST /api/admins/:adminId/profile-picture - Upload/update profile picture
router.post('/:adminId/profile-picture', 
  authenticateToken, 
  // TODO: Add more specific authorization - admin can change anyone, user can change their own
  authorizeRole(['administrator']), // For now, only admins can change any profile pic
  upload.single('profilePicture'), // 'profilePicture' is the field name in FormData
  async (req, res, next) => {
    const { adminId } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: 'No profile picture file uploaded.' });
    }

    const profileImageUrl = `/uploads/profile_pictures/${req.file.filename}`;

    try {
      // TODO: If user previously had a picture, delete the old file from storage
      const result = await db.query(
        'UPDATE admins SET profile_image_url = $1, updated_at = NOW() WHERE id = $2 RETURNING profile_image_url',
        [profileImageUrl, adminId]
      );
      if (result.rows.length === 0) {
        // If adminId not found, delete uploaded file to prevent orphans
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Admin user not found.' });
      }
      res.json({ 
        message: 'Profile picture updated successfully.', 
        profile_image_url: result.rows[0].profile_image_url 
      });
    } catch (err) {
      // If DB update fails, delete uploaded file
      fs.unlinkSync(req.file.path);
      next(err);
    }
  }
);

// DELETE /api/admins/:adminId/profile-picture - Delete profile picture
router.delete('/:adminId/profile-picture', 
  authenticateToken, 
  authorizeRole(['administrator']), // TODO: User should be able to delete their own
  async (req, res, next) => {
    const { adminId } = req.params;
    try {
      const adminResult = await db.query('SELECT profile_image_url FROM admins WHERE id = $1', [adminId]);
      if (adminResult.rows.length === 0) {
        return res.status(404).json({ message: 'Admin user not found.' });
      }
      const currentImageUrl = adminResult.rows[0].profile_image_url;
      if (!currentImageUrl) {
        return res.status(404).json({ message: 'No profile picture to delete.' });
      }

      await db.query('UPDATE admins SET profile_image_url = NULL, updated_at = NOW() WHERE id = $1', [adminId]);
      
      // Delete the actual file
      const imagePath = path.join(__dirname, '../', currentImageUrl); // Construct absolute path
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      res.json({ message: 'Profile picture deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// TODO: Implement other admin management routes:
// POST /api/admins - Create a new admin user
// PUT /api/admins/:adminId - Update admin user details (username, role)
// PUT /api/admins/:adminId/password - Change password for an admin user
// DELETE /api/admins/:adminId - Delete an admin user

module.exports = router; 