import { Router } from "express";
import * as Validators from "./owner.validation.js";
import { validation } from "../../middleware/validation.js";
import auth from "../../middleware/auth.js";
import * as ownerController from "./controller/owner.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
const router = Router();

router.get("/logout", (req, res, next) => {
  req.logout();
  res.redirect("/");
});
router.patch("/changePassword", auth, ownerController.changePassword);

router.post(
  "/register",
  fileUpload([...fileValidation.image, ...fileValidation.file]).fields([
    { name: "profileImage", maxCount: 1 },
    { name: "files", maxCount: 4 },
  ]),
  // validation(Validators.registerSchema),

  ownerController.register
);

// router.get(
//   "/confirmEmail/:activationCode",
//   validation(Validators.activateSchema),
//   userController.activationAccount
// );

router.post(
  "/login",
  // validation(Validators.login)
  ownerController.login
);

//send forget password

router.patch(
  "/sendForgetCode",
  validation(Validators.sendForgetCode),
  ownerController.sendForgetCode
);
router.patch("/resendCode", auth, ownerController.resendCode);

router.patch(
  "/VerifyCode",
  auth,
  validation(Validators.verify),
  ownerController.VerifyCode
);
router.patch(
  "/resetPassword",
  auth,
  validation(Validators.resetPassword),
  ownerController.resetPasswordByCode
);
router.patch(
  "/completeRegister",
  auth,
  fileUpload([...fileValidation.image, ...fileValidation.file]).fields([
    { name: "profileImage", maxCount: 1 },
    { name: "IDPhoto", maxCount: 1 },
    { name: "FictionAndSimile", maxCount: 1 },
    { name: "DrugAnalysis", maxCount: 1 },
    { name: "MaintenanceGuarantee", maxCount: 1 },
  ]),
  validation(Validators.completeValidationSchema),
  ownerController.complete
);

router.get("/lastTrips", auth, ownerController.lastTrips);
router.patch(
  "/cancelTrip/:tripId",
  auth,
  validation(Validators.tripId),
  ownerController.cancelTrip
);
router.get("/trips", auth, ownerController.trips);
router.get("/createdActivities", auth, ownerController.getCreatedActivities);
router.get("/getUpdatedActiv", auth, ownerController.getActivity);
router.post(
  "/addTripLeader",
  auth,
  fileUpload([...fileValidation.image, ...fileValidation.file]).fields([
    { name: "IDPhoto", maxCount: 1 },
    { name: "FictionAndSimile", maxCount: 1 },
    { name: "MaintenanceGuarantee", maxCount: 1 },
    { name: "DrugAnalysis", maxCount: 1 },
    { name: "profileImage", maxCount: 1 },
  ]),

  ownerController.addTripLeader
);

router.get("/codeShare", auth, ownerController.getOwnerCode);
router.patch("/register-agreement", auth, ownerController.registerAgreement);
router.get("/myProfile", auth, ownerController.myProfile);
router.get("/trip/:tripId", auth, ownerController.getSingleTrip);
export default router;
