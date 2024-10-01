import { Router } from "express";
import * as activityController from "./controller/activity.js";
import auth from "../../middleware/auth.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";

const router = Router();

router.post(
  "/add",
  auth,
  isAuthorized("owner"),
  fileUpload(fileValidation.image).single("image"),
  activityController.addActivity
);

router.delete(
  "/:activityId",
  auth,
  isAuthorized("owner"),
  activityController.deleteActivity
);

router.patch(
  "/updateActivity/:activityId",
  auth,
  isAuthorized("owner"),
  activityController.updateActivity
);

router.get("/activities/:typeId", auth, activityController.getActivities);

export default router;
