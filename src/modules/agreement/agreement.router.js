import { Router } from "express";
import * as agreementController from "./controller/agreement.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./agreement.validation.js";
import auth from "../../middleware/auth.js";

const router = Router();

router.post(
  "/",
  // auth, //dashboard
//  validation(validators.addAgreement),
  agreementController.addAgreement
);
router.get("/", agreementController.getAgreement);

router.post(
  "/owner",
 // validation(validators.addAgreement),

  agreementController.addAgreementOwner
);

router.get("/ownerRegister", agreementController.getRegisterAgreement);

export default router;
