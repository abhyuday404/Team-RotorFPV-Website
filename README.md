# Team Rotor FPV - Official Website

Welcome to the codebase for the official Team Rotor FPV website! This project features a stunning React frontend with dynamic 3D WebGL graphics and a secure Node.js backend for administrative control.

## 🚀 Tech Stack

**Frontend:**
- React 18 + Vite
- WebGL & GLSL (Custom 3D Infinite Menu)
- Firebase (Firestore & Authentication)
- Cloudinary (Image Uploads)
- Vanilla CSS

**Backend:**
- Node.js + Express
- Firebase Admin SDK (Secure Claims)

## 💻 How to Run Locally

Because this project uses a separate frontend and backend for security, you need to run **two** terminals side-by-side.

### 1. Start the Backend Server (Terminal 1)
The backend acts as the secure bouncer that grants admin privileges using the secret Service Account Key.

```bash
# Navigate to the server folder
cd server

# Install the server dependencies (only needed the first time)
npm install

# Start the Node.js server
npm run dev
```
*(The server will start running at `http://localhost:3000`)*

### 2. Start the React Frontend (Terminal 2)
This is the beautiful user-facing website.

```bash
# Open a new terminal in the main project folder (Team-RotorFPV-Website)

# Install the frontend dependencies (only needed the first time)
npm install

# Start the Vite development server
npm run dev
```
*(The website will automatically open in your browser, usually at `http://localhost:5173`)*

## 🔒 Adding New Admins
The frontend handles the "Sign in with Google" popup. To grant an admin badge to a new team member:
1. They must log in to the website using Google.
2. Once logged in, an existing admin goes to the Admin Dashboard and uses their email to grant them Admin privileges.

## 📦 Deployment Notes
- **Frontend (Vercel/Netlify):** Set the build command to `npm run build` and output to the `dist` folder. Make sure to set the `VITE_API_URL` environment variable to your live backend URL so the frontend knows where to send requests.
- **Backend (Render/Railway):** Deploy the `server` folder. You **must** add your `serviceAccountKey.json` details as secure Environment Variables in your hosting provider's dashboard, as they are ignored by Git.
