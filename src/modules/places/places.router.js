import { Router } from "express";
import * as validators from "./places.validation.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";

import * as placesController from "./controller/places.js";
import auth from "../../middleware/auth.js";
import { validation } from "../../middleware/validation.js";
const router = Router({ mergeParams: true });

router.get("/updatedPlaces", auth, placesController.getUpdatedPlaces);

router.post(
  "/",
  auth,
  isAuthorized("owner"),
  fileUpload([
    ...fileValidation.image,
    ...fileValidation.video,
    ...fileValidation.file,
  ]).fields([
    { name: "placeImages", maxCount: 10 },
    { name: "placeVideo", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  // validation(validators.createSubCategory),
  placesController.addPlace
);
router.get("/", auth, isAuthorized("owner"), placesController.getAllPlaces);
router.get("/placesName", auth, placesController.placesName);
router.get("/:placeId", auth, isAuthorized("owner"), placesController.getPlace);
router.patch(
  "/:placeId",
  auth,
  isAuthorized("owner"),
  fileUpload([
    ...fileValidation.image,
    ...fileValidation.video,
    ...fileValidation.file,
  ]).fields([
    { name: "placeImages", maxCount: 10 },
    { name: "placeVideo", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  // validation(validators.updateSubCategory),
  placesController.updatePlace
);
router.delete(
  "/:placeId",
  auth,
  isAuthorized("owner"),
  // validation(validators.deleteSubCategory),
  placesController.deletePlace
);

export default router;
