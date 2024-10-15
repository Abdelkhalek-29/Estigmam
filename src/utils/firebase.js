// firebase.js
import admin from "firebase-admin";
import serviceAccount from "../../config/estigmam-d058e-firebase-adminsdk-qn1e0-4c73a80468.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
