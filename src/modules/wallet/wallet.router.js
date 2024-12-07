import { Router } from "express";
import * as walletController from "./controller/wallet.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./wallet.validation.js";
import auth from "../../middleware/auth.js";

const router = Router();
// User APP
router.post("/charge", auth, walletController.charging);
router.get("/userWallet", auth, walletController.userWallet);

export default router;
