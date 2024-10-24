import { Router } from "express";
import auth from "../../middleware/auth.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import * as tripLeaderController from "./controller/tripLeader.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./tripLeader.validation.js";
const router = Router({ mergeParams: true });

router.post(
  "/add",
  auth,
  isAuthorized("owner"),
  tripLeaderController.addTripLeader
);

router.get(
  "/",
  auth,
  isAuthorized("owner"),
  tripLeaderController.getAllLeaders
);

router.post(
  "/rate/:tripId",
  auth,
  isAuthorized("user"),
  tripLeaderController.addRatingAndComment
);

router.patch(
  "/updatePassword",
  auth,
  tripLeaderController.updateTripLeaderPassword
);
router.put(
  "/completeProfile",
  auth,
  fileUpload([...fileValidation.image, ...fileValidation.file]).fields([
    { name: "profileImage", maxCount: 1 },
    { name: "IDPhoto", maxCount: 1 },
    { name: "FictionAndSimile", maxCount: 1 },
    { name: "DrugAnalysis", maxCount: 1 },
    { name: "MaintenanceGuarantee", maxCount: 1 },
  ]),
  tripLeaderController.completeProfile
);

router.patch(
  "/startTrip/:tripId",
  auth,
  validation(validators.tripId),
  tripLeaderController.start
);
router.patch(
  "/finishTrip/:tripId",
  auth,
  validation(validators.tripId),
  tripLeaderController.finishTrip
);
router.patch(
  "/cancelTrip/:tripId",
  auth,
  validation(validators.tripId),
  tripLeaderController.cancelTrip
);

router.get(
  "/rateDetails/:tripId",
  validation(validators.tripId),
  tripLeaderController.rateDetails
);

router.patch("/inActive/:id",auth,tripLeaderController.deactivateTripLeader)
router.patch("/active/:id",auth,tripLeaderController.activateTripLeader)
router.delete("/:id",auth,tripLeaderController.deleteTripLeader)

export default router;
