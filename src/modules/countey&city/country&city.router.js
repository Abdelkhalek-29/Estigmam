import { Router } from "express";
import * as cityCountryController from "./controller/country&city.js";
import { validation } from "../../middleware/validation.js";
import * as Validators from "./country&city.validation.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
const router = Router();

router.post(
  "/addCountry",
  fileUpload(fileValidation.image).single("image"),
  validation(Validators.addCountry),
  cityCountryController.addCountry
);
router.post(
  "/addCity/:countryId",
  validation(Validators.addCity),
  cityCountryController.addCity
);
router.get("/getAllcountry", cityCountryController.getAllcountry);
router.get("/getAllcity", cityCountryController.getAllcity);

export default router;
