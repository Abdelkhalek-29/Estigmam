import { Router } from "express";
import * as walletController from "./controller/wallet.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./wallet.validation.js";
import auth from "../../middleware/auth.js";

const router = Router();
// User APP
router.post("/charge", auth, walletController.charging);
router.get("/userWallet", auth, walletController.userWallet);
// Owner App
router.post("/bankAccount", auth, walletController.bankAccount);
router.post("/ownerCharge", auth, walletController.walletCharging);
router.get("/ownerWallet", auth, walletController.ownerWallet);
// add banks
router.post("/addBank", walletController.addBank);
router.get("/getBanks", walletController.getBanks);
export default router;
