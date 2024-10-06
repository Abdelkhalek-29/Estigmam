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
  (req, res, next) => {
    // Log request details here to check if the request is reaching the route
    console.log("Request received at /completeRegister");
    console.log(req.method); // Log HTTP method
    console.log(req.headers); // Log request headers
    console.log(req.body); // Log request body

    next(); // Move to the next middleware (authentication)
  },

  auth,
  (req, res, next) => {
    console.log("Request Headers:", req.headers);
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);
    next();
  },
  fileUpload([...fileValidation.image, ...fileValidation.file]).fields([
    { name: "profileImage", maxCount: 1 },
    { name: "IDPhoto", maxCount: 1 },
    { name: "FictionAndSimile", maxCount: 1 },
    { name: "DrugAnalysis", maxCount: 1 },
    { name: "MaintenanceGuarantee", maxCount: 1 },
  ]),
  (req, res, next) => {
    // Log after the fileUpload middleware
    console.log("Files after fileUpload:", req.files);
    next();
  },
  validation(Validators.completeValidationSchema),
  (req, res, next) => {
    // Log after validation
    console.log("Request after validation:", req.body);
    next();
  },
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

export default router;
