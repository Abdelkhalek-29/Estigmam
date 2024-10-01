import { Router } from "express";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import auth from "../../middleware/auth.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import * as toolController from "../tool/controller/tool.js";
const router = Router({ mergeParams: true });

router.post(
  "/addTool",
  auth,
  isAuthorized("owner"),
  fileUpload([
    ...fileValidation.file,
    ...fileValidation.image,
    ...fileValidation.video,
  ]).fields([
    { name: "license", maxCount: 1 },
    { name: "toolImages", maxCount: 8 },
    { name: "toolVideo", maxCount: 1 },
  ]),
  // validation(validators.createTool),
  toolController.addTool
);

router.patch(
  "/updateTool/:id",
  auth,
  isAuthorized("owner"),
  fileUpload([
    ...fileValidation.file,
    ...fileValidation.video,
    ...fileValidation.image,
  ]).fields([
    { name: "license", maxCount: 1 },
    { name: "toolImages", maxCount: 8 },
    { name: "toolVideo", maxCount: 1 },
  ]),
  toolController.updateTool
);

router.delete(
  "/deleteTool/:id",
  auth,
  isAuthorized("owner"),
  toolController.deleteTool
);

router.get("/mytools", auth, isAuthorized("owner"), toolController.getAllTools);

router.get(
  "/mytool/:id",
  auth,
  isAuthorized("owner"),
  toolController.getToolById
);
router.patch(
  "/ExaminationDate/:id",
  auth,
  isAuthorized("owner"),
  toolController.ExaminationDate
);
export default router;
