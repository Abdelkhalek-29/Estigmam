import { Router } from "express";
import * as berthController from "./controller/berth.js";
import { validation } from "../../middleware/validation.js";
import * as Validators from "./berth.validation.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import auth from "../../middleware/auth.js";
const router = Router();

router.post(
  "/addBerth",
  fileUpload(fileValidation.image).fields([
    { name: "berthImages", maxCount: 3 },
  ]),
  berthController.addBerth
);

router.get("/getAllBerth/:cityId", berthController.getAllBerth);
// MAP
router.get("/getBerths", berthController.getBerths);
router.post("/nearest-berth", berthController.nearest);
router.get(
  "/tripsCounter",
  auth,
  berthController.getUpcomingTripsCountPerBerth
);
export default router;
