import { Router } from "express";
import * as Validators from "./auth.validation.js";
import { validation } from "../../middleware/validation.js";
import auth from "../../middleware/auth.js";
import * as userController from "./controller/auth.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
const router = Router();

router.post(
  "/register",
  validation(Validators.registerSchema),
  userController.register
);

// router.get(
//   "/confirmEmail/:activationCode",
//   validation(Validators.activateSchema),
//   userController.activationAccount
// );

router.post("/login", validation(Validators.login), userController.login);

//send forget password
router.put(
  "/updateProfile",
  auth,
  fileUpload(fileValidation.image).single("profileImage"),
  // validation(Validators.updateProfileImage),

  userController.updateProfile
);

router.patch(
  "/sendForgetCode",
  validation(Validators.sendForgetCode),
  userController.sendForgetCode
);
router.patch("/resendCode", auth, userController.resendCode);
router.patch(
  "/verificationCode",
  auth,
  validation(Validators.verify),
  userController.verificationCode
);
router.patch(
  "/VerifyCode",
  auth,
  validation(Validators.verify),
  userController.VerifyCode
);
router.patch(
  "/resetPassword",
  auth,
  validation(Validators.resetPassword),
  userController.resetPasswordByCode
);
router.get("/",userController.getUser)
router.get("/userCode", auth, userController.getUserCode);
router.get("/tokenIsValid", userController.tokenIsValid);
export default router;
