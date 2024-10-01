import { Router } from "express";
import * as discountController from "./controller/discount.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./discount.validation.js";
import auth from "../../middleware/auth.js";

const router = Router();

router.patch(
  "/",
  // auth, //dashboard
  discountController.addDiscount
);

export default router;
