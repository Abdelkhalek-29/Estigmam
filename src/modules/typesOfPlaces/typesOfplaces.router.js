import { Router } from "express";
import * as typesOfPlacesController from "./controller/typesOfPlaces.js";
// import { validation } from "../../middleware/validation.js";
// import * as validators from "./wallet.validation.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";

const router = Router({ mergeParams: true });

router.post(
  "/",
  //   validation(validators.addInfoApp),
 // fileUpload(fileValidation.image).single("image"),
  typesOfPlacesController.typesOfPlaces
);
router.delete("/:typeOfPlaceId", typesOfPlacesController.deleteTypesOfPlaces);
router.put(
  "/:typeOfPlaceId",
  fileUpload(fileValidation.image).single("image"),
  typesOfPlacesController.updateTypesOfPlaces
);
router.get("/all/withActivity", typesOfPlacesController.getallWithActivity);
router.get("/all/:anyType", typesOfPlacesController.anyType);
router.get("/:categoryId", typesOfPlacesController.getTypesOfPlaces);

// test
router.get("/types-with-activities/:categoryId", typesOfPlacesController.getTypesAndActivities);

export default router;
