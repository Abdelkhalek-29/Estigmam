import { Router } from "express";
import * as bannerController from "./controller/banner.js";
import { validation } from "../../middleware/validation.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import * as validators from "./banner.validation.js";
import auth from "../../middleware/auth.js";
import { isValidObjectId } from "mongoose";

const router = Router();

router.post(
  "/createBanner",
 // auth, //dashboard
  fileUpload(fileValidation.image).single("image"),
  validation(validators.createBanner),
  bannerController.createBanner
);
router.get("/", bannerController.getBanner);

export default router;
