import { Router } from "express";
import * as creditCardController from "./controller/creditCard.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./creditCard.validation.js";
import auth from "../../middleware/auth.js";

const router = Router();

router.post(
  "/",
  auth, 
  //validation(validators.createBanner),
  creditCardController.addCreditCard
);
router.get("/", auth,creditCardController.getCreditCard);
router.get("/:id",auth, creditCardController.getCreditCardById);
router.put("/:id",auth, creditCardController.updateCreditCard);
router.delete("/:id",auth, creditCardController.deleteCreditCard);


export default router;
