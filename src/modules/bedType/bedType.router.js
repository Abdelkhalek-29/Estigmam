import { Router } from "express";
import * as bedTypeController from "./controller/bedType.js";
import auth from "../../middleware/auth.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";

const router = Router();

router.post(
  "/add",
  auth,
  isAuthorized("owner"),

  fileUpload(fileValidation.image).single("image"),
  bedTypeController.addBedType
);

router.get(
  "/get",

  bedTypeController.getBedType
);

router.get("/get/:id", bedTypeController.getBedTypeById);

router.patch(
  "/update/:id",
  auth,
  isAuthorized("owner"),

  fileUpload(fileValidation.image).single("image"),
  bedTypeController.updateBedType
);

router.delete(
  "/delete/:id",
  auth,
  isAuthorized("owner"),

  bedTypeController.deleteBedType
);

export default router;
