import admin from "firebase-admin";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(
  __dirname,
  "../../config/estigmam-d058e-firebase-adminsdk-qn1e0-4c73a80468.json"
);

const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const messaging = admin.messaging();

export { messaging };
