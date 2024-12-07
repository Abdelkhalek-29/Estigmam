import { Router } from "express";
import auth from "../../middleware/auth.js";
import { initiateCardPayment } from "./controller/payment.js";
const router = Router();

// GET: Check order status
router.post("/payWithCard", auth, initiateCardPayment);
export default router;
