import admin from "firebase-admin";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get the current file path using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct path to the service account file (outside src folder)
const serviceAccountPath = path.join(
  __dirname,
  "../../config/estigmam-d058e-firebase-adminsdk-qn1e0-4c73a80468.json"
);

console.log("Service Account Path:", serviceAccountPath);

// Read the service account JSON file
const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const messaging = admin.messaging();

export { messaging };
