import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
// Make sure serviceAccountKey.json is in the root of the server folder
const serviceAccount = JSON.parse(readFileSync(new URL('../serviceAccountKey.json', import.meta.url)));

initializeApp({
  credential: cert(serviceAccount)
});

async function makeAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Please provide an email address.');
    console.error('Usage: node scripts/setFirstAdmin.js <email>');
    process.exit(1);
  }

  try {
    const userRecord = await getAuth().getUserByEmail(email);
    await getAuth().setCustomUserClaims(userRecord.uid, { admin: true, superAdmin: true });
    console.log(`Successfully granted super admin privileges to ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error granting admin privileges:', error);
    process.exit(1);
  }
}

makeAdmin();
