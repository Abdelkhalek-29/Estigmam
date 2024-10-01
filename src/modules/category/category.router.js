import { Router } from "express";
import * as categoryController from "./controller/category.js";
import * as validators from "./category.validation.js";
import typeOfPlacesRouter from "../typesOfPlaces/typesOfplaces.router.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import auth from "../../middleware/auth.js";
import { validation } from "../../middleware/validation.js";

const router = Router();

router.post(
  "/createCategory",
  auth,
  isAuthorized("owner"),
  fileUpload(fileValidation.image).single("category"),
  validation(validators.createCategory),
  categoryController.createCategory
);

router.patch(
  "/update/:categoryId",
  auth,
  isAuthorized("owner"),
  fileUpload(fileValidation.image).single("category"),
  validation(validators.updateCategory),
  categoryController.updateCategory
);

router.use("/:categoryId/typeOfPlaces", typeOfPlacesRouter);

router.delete(
  "/delete/:categoryId",
  auth,
  isAuthorized("owner"),
  validation(validators.deleteCategory),
  categoryController.deleteCategory
);

router.get("/getAllCategory", categoryController.getAllCategory);

export default router;
