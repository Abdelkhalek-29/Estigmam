import { Router } from "express";
import * as tripController from "./controller/trip.js";
import { fileUpload, fileValidation } from "../../utils/multer.js";
import * as validators from "./trip.validation.js";
import auth from "../../middleware/auth.js";
import { validation } from "../../middleware/validation.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import optionalAuth from "../../middleware/optionalAuth.js";
const router = Router({ mergeParams: true });

router.post(
  "/createTrip",
  auth,
  isAuthorized("owner"),
  validation(validators.createTrip),
  tripController.createTrip
);
router.post(
  "/planNewTrip",
  auth,
  /* 
  validation(validators.createTrip),*/
  tripController.createTrip
);
router.delete(
  "/deleteTrip/:tripId",
  auth,
  validation(validators.tripId),
  tripController.deleteTrip
);
router.put(
  "/deletePlanNewTrip/:tripId",
  auth,
  // validation(validators.tripId),
  tripController.deleteTrip
);
router.put(
  "/redHeart/:tripId",
  auth,
  isAuthorized("user"),
  validation(validators.tripId),
  tripController.redHeart
);
router.get("/wishlist", auth, isAuthorized("user"), tripController.wishlist);

router.get("/", tripController.getallTrip);
router.get(
  "/single/:tripId",
  optionalAuth,
  isAuthorized("user"),
  validation(validators.tripId),
  tripController.getTrip
);
router.put(
  "/BookedTrip/:tripId",
  auth,
  isAuthorized("user"),
  validation(validators.bookeTicket),
  tripController.BookedTrip
);
router.get(
  "/getTripByOffer/:categoryId",
  validation(validators.categoryId),
  tripController.getTripByOffer
);
router.get(
  "/selected/:typeOfPlaceId",
  optionalAuth,
  isAuthorized("user"),
  tripController.getByTypes
);

router.get(
  "/home/:categoryId",
  optionalAuth,
  isAuthorized("user"),
  validation(validators.categoryId),
  tripController.home
);
router.post(
  "/rate/:tripId",
  auth,
  isAuthorized("user"),
  validation(validators.rating),
  tripController.addRatingAndComment
);
router.get(
  "/rateDetails/:tripId",
  validation(validators.tripId),
  tripController.rateDetails
);

router.get(
  "/scheduleTrips",
  auth,
  isAuthorized("user"),
  //validation(validators.scheduleUserTrips.query),
  tripController.getScheduleUserTrips
);

router.patch(
  "/cancel/:tripId",
  auth,
  isAuthorized("user"),
  tripController.cancel
);

router.get('/trips-by-berth',auth ,tripController.tripsByBerth)
router.get('/upcoming-by-berth',auth,tripController.getUpcomingTripsByBerth)
export default router;
