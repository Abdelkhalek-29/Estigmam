import { Router } from "express";
import * as validators from "./subSubcategory.validation.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import * as subSubCategoryController from "../subSubcategory/controller/subSubcategory.js";
import auth from "../../middleware/auth.js";
import { validation } from "../../middleware/validation.js";
const router = Router({ mergeParams: true });

router.post(
  "/addSubSubcategory",
  auth,
  isAuthorized("owner"),
//   validation(validators.createSubSubCategory),
  subSubCategoryController.createSubSubCategory
);

// router.patch(
//   "/:subSubcategoryId",
//   auth,
//   isAuthorized("owner"),
//   validation(validators.updateSubSubCategory),
//   subSubCategoryController.updateSubSubCategory
// );

// router.delete(
//   "/:subSubcategoryId",
//   auth,
//   isAuthorized("owner"),
//   validation(validators.deleteSubSubCategory),
//   subSubCategoryController.deleteSubSubCategory
// );

router.get("/getAllSubcategory", subSubCategoryController.getAllSubcategory);

export default router;
