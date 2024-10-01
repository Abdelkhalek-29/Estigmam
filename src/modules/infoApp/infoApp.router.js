import { Router } from "express";
import * as infoAppController from "./controller/infoApp.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./infoApp.validation.js";

const router = Router();
router.post(
  "/owner",
  validation(validators.addInfoApp),
  infoAppController.addInfoAppOwner
);
router.post(
  "/",
  // auth, //dashboard
  validation(validators.addInfoApp),
  infoAppController.addInfoApp
);
router.get("/owner", infoAppController.getInfoAppOwner);

router.get("/", infoAppController.getInfoApp);





export default router;
