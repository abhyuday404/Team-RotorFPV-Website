import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
// The service account key should be downloaded from Firebase Console -> Project Settings -> Service Accounts
// Save it as serviceAccountKey.json in the server folder (make sure to add to .gitignore)
import { readFileSync } from 'fs';

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Use environment variable in production (Render, Railway, etc.)
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Use local file for development
  serviceAccount = JSON.parse(readFileSync(new URL('./serviceAccountKey.json', import.meta.url)));
}

initializeApp({
  credential: cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

// ── Cloudinary configuration ──
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer configuration (memory storage, image-only, 10 MB limit) ──
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'));
    }
    cb(null, true);
  },
});

// Middleware to verify if the requester is an admin
const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    if (decodedToken.admin !== true) {
      return res.status(403).json({ error: 'Forbidden: Requires admin privileges' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Endpoint to grant admin access
app.post('/api/setAdmin', verifyAdmin, async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Look up the user by email
    const userRecord = await getAuth().getUserByEmail(email);
    
    // Set custom claim
    await getAuth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    res.json({ message: `Successfully granted admin privileges to ${email}` });
  } catch (error) {
    console.error('Error setting admin:', error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found. They must sign in at least once first.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to revoke admin access
app.post('/api/removeAdmin', verifyAdmin, async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Prevent admin from removing themselves
  if (req.user.email === email) {
    return res.status(400).json({ error: 'You cannot remove your own admin privileges.' });
  }

  try {
    const userRecord = await getAuth().getUserByEmail(email);
    
    // Remove custom claim (or set to false)
    await getAuth().setCustomUserClaims(userRecord.uid, { admin: false });
    
    res.json({ message: `Successfully revoked admin privileges from ${email}` });
  } catch (error) {
    console.error('Error revoking admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to list all admins (optional utility)
app.get('/api/admins', verifyAdmin, async (req, res) => {
  try {
    // In a real app with many users, you'd probably store admin status in Firestore too just for querying,
    // since Firebase Auth doesn't have a direct "get users with claim" query.
    // For this small app, we iterate through all users (up to 1000)
    const listUsersResult = await getAuth().listUsers(1000);
    const admins = listUsersResult.users
      .filter(user => user.customClaims && user.customClaims.admin === true)
      .map(user => user.email);
      
    res.json({ admins });
  } catch (error) {
    console.error('Error listing admins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Image upload endpoint (admin-only, signed Cloudinary upload) ──
app.post('/api/upload', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'team-rotor' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.json({
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Handle multer errors (file too large, wrong type)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 10 MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message && err.message.includes('images are allowed')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Admin backend server running on port ${PORT}`);
});
