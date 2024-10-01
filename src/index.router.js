import authRouter from "./modules/auth/auth.router.js";
import ownerRouter from "./modules/owner/owner.router.js";
import categoryRouter from "./modules/category/category.router.js";
import berthRouter from "./modules/berth/berth.router.js";
import tripRouter from "./modules/trip/trip.router.js";
// import customizeTripRouter from "./modules/customizeTrip/customizeTrip.router.js";
import bannerRouter from "./modules/banner/banner.router.js";
import rattingOwnerRouter from "./modules/rattingOwner/rattingOwner.router.js";
import bedTypeRouter from "./modules/bedType/bedType.router.js";
import toolRouter from "./modules/tool/tool.router.js";
import infoAppRouter from "./modules/infoApp/infoApp.router.js";
import agreementRouter from "./modules/agreement/agreement.router.js";
import creditCardRouter from "./modules/creditCard/creditCard.router.js";
import tripLeaderRouter from "./modules/tripLeader/tripLeader.router.js";
import placesRouter from "./modules/places/places.router.js";
import typesOfPlacesRouter from "./modules/typesOfPlaces/typesOfplaces.router.js";
import walletRouter from "./modules/wallet/wallet.router.js";
import additionRouter from "./modules/addition/addition.router.js";
import messageRouter from "./modules/message/message.router.js";
import discountRouter from "./modules/discount/discount.router.js";
import notificationRouter from "./modules/notification/notification.router.js";
import subSubCategoryRouter from "./modules/subSubcategory/subSubcategory.router.js";
import cityAndCountryRouter from "./modules/countey&city/country&city.router.js";
import searchRouter from "./modules/search/search.router.js";
import activityRouter from "./modules/activity/activity.router.js";
import { globalErrorHandling } from "./utils/errorHandling.js";
import cors from "cors";
const initApp = (app, express) => {
  app.use(cors());
  //convert Buffer Data
  app.use(express.json());

  //Setup API Routing
  app.use(`/auth`, authRouter);
  app.use(`/owner`, ownerRouter);
  app.use("/tripLeader", tripLeaderRouter);
  app.use(`/category`, categoryRouter);
  app.use(`/places`, placesRouter);
  app.use(`/tool`, toolRouter);
  app.use(`/typesOfPlaces`, typesOfPlacesRouter);
  app.use(`/trip`, tripRouter);
  app.use(`/cityAndCountry`, cityAndCountryRouter);
  // app.use(`/customizeTrip`, customizeTripRouter);
  app.use(`/banner`, bannerRouter);
  app.use(`/infoApp`, infoAppRouter);
  app.use(`/agreement`, agreementRouter);
  app.use(`/creditCard`, creditCardRouter);
  app.use(`/wallet`, walletRouter);
  app.use(`/subSubCategory`, subSubCategoryRouter);
  app.use("/search", searchRouter);
  app.use("/activity", activityRouter);
  app.use("/addition", additionRouter);
  app.use("/discount", discountRouter);
  app.use("/message", messageRouter);
  app.use("/berth", berthRouter);

  app.use("/notification", notificationRouter);
  app.use("/bedType", bedTypeRouter);
  app.use("/rattingOwner",rattingOwnerRouter)

  app.all("*", (req, res, next) => {
    res.send("In-valid Routing Plz check url  or  method");
  });
  app.use(globalErrorHandling);
};

export default initApp;
