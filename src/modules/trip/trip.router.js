import { Router } from "express";
import * as tripController from "./controller/trip.js";
import * as validators from "./trip.validation.js";
import auth from "../../middleware/auth.js";
import { validation } from "../../middleware/validation.js";
import { isAuthorized } from "../../middleware/authorization.middleware.js";
import optionalAuth from "../../middleware/optionalAuth.js";
import { rawBodyMiddleware } from "../../middleware/rawBodyMiddleware.js";
const router = Router({ mergeParams: true });

router.post(
  "/createTrip",
  auth,
  // isAuthorized("owner"),
  // validation(validators.createTrip),
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
router.post("/webhook", rawBodyMiddleware, tripController.handleWebhook);

router.get("/invoice/:invoiceId", tripController.getInvoice);
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

router.get("/trips-by-berth", auth, tripController.tripsByBerth);
router.get("/upcoming-by-berth", auth, tripController.getUpcomingTripsByBerth);
/*router.get(
  "/category/:categoryId",
//  validation(validators.categoryId),
  tripController.category 
)*/
router.get(
  "/Categories",
  tripController.getAllCategoriesWithTypesAndActivities
);
router.get("/getLeaders/:type", auth, tripController.getLeaders);
router.get("/getTools", auth, tripController.getTools);
router.get("/getPlaces", auth, tripController.getPlaces);
export default router;
