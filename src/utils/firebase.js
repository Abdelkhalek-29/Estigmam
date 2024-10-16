import admin from "firebase-admin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Use require to import the JSON file
const serviceAccount = require("../../config/estigmam-d058e-firebase-adminsdk-qn1e0-4c73a80468.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
