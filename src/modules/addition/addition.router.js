import { Router } from "express";
import * as additionController from "./controller/addition.js";
import auth from "../../middleware/auth.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";

const router = Router();

router.post(
  "/add",
  auth,
  isAuthorized("owner"),
  fileUpload(
    fileValidation.image
  ).single("image")
  ,
  additionController.addAddition
);

router.get("/get", additionController.getAdditions);

router.get("/get/:id", additionController.getAddition);

router.patch(
  "/update/:id",
  auth,
  isAuthorized("owner"),
  fileUpload(
    fileValidation.image
  ).single("image"),
  additionController.updateAddition
);  

router.delete("/delete/:id", auth, isAuthorized("owner"), additionController.deleteAddition);





export default router;
