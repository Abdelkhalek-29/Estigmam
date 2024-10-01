// firebase.js
import admin from "firebase-admin";
import serviceAccount from "../../config/estigmam-test-firebase-adminsdk-7kr1a-ded17dd956.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
