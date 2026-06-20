import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
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

const db = getFirestore();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://teamrotorfpv.com',
  'https://www.teamrotorfpv.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like server-to-server or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow dynamic Vercel preview URLs (e.g., https://project-123.vercel.app)
    if (origin.startsWith('https://') && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json());

// ── Cloudinary configuration ──
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer configuration (memory storage, image-only, 10 MB limit) ──
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/heic-sequence', 'application/octet-stream', ''];
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname ? file.originalname.split('.').pop().toLowerCase() : '';
    
    // Browsers often don't have a registered MIME type for HEIC files 
    // and send them as application/octet-stream or empty string.
    // We check both the mime type and the file extension for safety.
    const isValidMime = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const isValidExt = ALLOWED_EXTS.includes(ext);

    if (!(isValidMime && isValidExt)) {
      return cb(new Error('Only JPEG, PNG, WebP, GIF, and HEIC images are allowed.'));
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
    // verifyIdToken(token, checkRevoked) - passing true checks if the token was revoked
    const decodedToken = await getAuth().verifyIdToken(token, true);
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

// Middleware to verify if the requester is a Super Admin
const verifySuperAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token, true);
    if (decodedToken.superAdmin !== true && decodedToken.email !== process.env.SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Forbidden: Requires Super Admin privileges' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

const logAudit = async (action, userEmail, targetEmail) => {
  const logMessage = `[ROLE CHANGE] ${userEmail} ${action} ${targetEmail}`;
  console.log(logMessage);
  try {
    await db.collection('audit_logs').add({
      action,
      userEmail,
      targetEmail,
      timestamp: new Date()
    });
  } catch (e) {
    console.error("Failed to write audit log:", e);
  }
};

// Endpoint to grant admin access
app.post('/api/setAdmin', verifySuperAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const userRecord = await getAuth().getUserByEmail(email);
    const isSuper = userRecord.customClaims?.superAdmin === true;
    await getAuth().setCustomUserClaims(userRecord.uid, { admin: true, superAdmin: isSuper });
    await logAudit('granted admin to', req.user.email, email);
    res.json({ message: `Successfully granted admin privileges to ${email}` });
  } catch (error) {
    console.error('Error setting admin:', error);
    if (error.code === 'auth/user-not-found') return res.status(404).json({ error: 'User not found. They must sign in at least once first.' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to revoke admin access
app.post('/api/removeAdmin', verifySuperAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  if (email === process.env.SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ error: 'The root Super Admin cannot be modified.' });
  }
  if (req.user.email === email) {
    return res.status(400).json({ error: 'You cannot remove your own privileges.' });
  }

  try {
    const userRecord = await getAuth().getUserByEmail(email);
    if (userRecord.customClaims?.superAdmin === true) {
      const listUsersResult = await getAuth().listUsers(1000);
      const superAdmins = listUsersResult.users.filter(u => u.customClaims?.superAdmin === true);
      if (superAdmins.length <= 1 && req.user.email !== process.env.SUPER_ADMIN_EMAIL) {
         return res.status(400).json({ error: 'At least one Super Admin must remain.' });
      }
    }

    await getAuth().setCustomUserClaims(userRecord.uid, { admin: false, superAdmin: false });
    await getAuth().revokeRefreshTokens(userRecord.uid);
    await logAudit('revoked admin from', req.user.email, email);
    res.json({ message: `Successfully revoked admin privileges from ${email}` });
  } catch (error) {
    console.error('Error revoking admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to set super admin
app.post('/api/setSuperAdmin', verifySuperAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const userRecord = await getAuth().getUserByEmail(email);
    await getAuth().setCustomUserClaims(userRecord.uid, { admin: true, superAdmin: true });
    await logAudit('promoted to super admin', req.user.email, email);
    res.json({ message: `Successfully promoted ${email} to Super Admin` });
  } catch (error) {
    console.error('Error setting super admin:', error);
    if (error.code === 'auth/user-not-found') return res.status(404).json({ error: 'User not found.' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to remove super admin
app.post('/api/removeSuperAdmin', verifySuperAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  if (email === process.env.SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ error: 'The root Super Admin cannot be modified.' });
  }
  if (req.user.email === email) {
    return res.status(400).json({ error: 'You cannot demote yourself.' });
  }

  try {
    const listUsersResult = await getAuth().listUsers(1000);
    const superAdmins = listUsersResult.users.filter(u => u.customClaims?.superAdmin === true);
    if (superAdmins.length <= 1 && req.user.email !== process.env.SUPER_ADMIN_EMAIL) {
       return res.status(400).json({ error: 'At least one Super Admin must remain.' });
    }

    const userRecord = await getAuth().getUserByEmail(email);
    await getAuth().setCustomUserClaims(userRecord.uid, { admin: true, superAdmin: false });
    await getAuth().revokeRefreshTokens(userRecord.uid);
    await logAudit('demoted from super admin', req.user.email, email);
    res.json({ message: `Successfully demoted ${email} to regular Admin` });
  } catch (error) {
    console.error('Error removing super admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to list all admins (optional utility)
app.get('/api/admins', verifyAdmin, async (req, res) => {
  try {
    const listUsersResult = await getAuth().listUsers(1000);
    const admins = listUsersResult.users
      .filter(user => user.customClaims && user.customClaims.admin === true)
      .map(user => ({
         email: user.email,
         isSuperAdmin: user.customClaims.superAdmin === true || user.email === process.env.SUPER_ADMIN_EMAIL,
         isRoot: user.email === process.env.SUPER_ADMIN_EMAIL
      }));
      
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

    // Optimize Cloudinary URL to automatically handle format (e.g., HEIC -> WebP) and quality
    const parts = result.secure_url.split('/upload/');
    const optimizedUrl = `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`;

    res.json({
      secure_url: optimizedUrl,
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
