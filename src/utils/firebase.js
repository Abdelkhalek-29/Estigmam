import admin from "firebase-admin";
import fs from "fs/promises";

// Replace with the correct path to your service account JSON file
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

// Read the service account JSON file
const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const messaging = admin.messaging();

export { messaging };
