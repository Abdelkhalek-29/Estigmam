import { asyncHandler } from "../../../utils/errorHandling.js";
import tripLeaderModel from "../../../../DB/model/tripLeader.model.js";
import Randomstring from "randomstring";
import tripModel from "../../../../DB/model/Trip.model.js";
import ratingModel from "../../../../DB/model/rating.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import OwnerModel from "../../../../DB/model/Owner.model .js";
import tokenModel from "../../../../DB/model/Token.model.js";
import jwt from "jsonwebtoken";
import notificationModel from "../../../../DB/model/notification.model.js";
import typesOfPlacesModel from "../../../../DB/model/typesOfPlaces.model.js";

const predefinedTypes = [
  { id: "66dcc2b4626dfd336c9d8732", name: { en: "Boats", ar: "مراكب" } },
  { id: "66dcc2c6626dfd336c9d873a", name: { en: "Yacht", ar: "يخت" } },
  { id: "66dc1b6737f54a0f875bf3ce", name: { en: "Jet boat", ar: "جيت بوت" } },
  { id: "66dc1ba737f54a0f875bf3d1", name: { en: "Sea bike", ar: "دباب بحرى" } },
];
export const addTripLeader = asyncHandler(async (req, res, next) => {
  const leaders = req.body;
  const ownerId = req.owner._id;

  const phoneArray = leaders.map((leader) => leader.phone);

  const existingLeaders = await tripLeaderModel.find({
    phone: { $in: phoneArray },
  });
  const existingPhones = existingLeaders.map((leader) => leader.phone);

  if (existingPhones.length > 0) {
    return next(
      new Error(
        `The following phone numbers already exist: ${existingPhones.join(
          ", "
        )}`,
        { status: 400 }
      )
    );
  }
  const newLeaders = leaders.map(({ countryCode, phone }) => ({
    countryCode,
    phone,
    password: Randomstring.generate({ length: 8 }),
    ownerId,
  }));

  const createdLeaders = await tripLeaderModel.insertMany(newLeaders);

  await OwnerModel.findByIdAndUpdate(ownerId, { addLeader: true });

  return res.status(201).json({
    success: true,
    message: "Message sent to trip leaders!",
    leaders: createdLeaders.map((leader) => ({
      countryCode: leader.countryCode,
      phone: leader.phone,
      password: leader.password,
    })),
  });
});

export const getAllLeaders = asyncHandler(async (req, res, next) => {
  const ownerId = req.owner._id;

  const tripLeaders = await tripLeaderModel
    .find({ ownerId })
    .select("_id name phone status profileImage");

  if (!tripLeaders) {
    return next(
      new Error("No trip leaders found for this owner", { cause: 404 })
    );
  }

  res.status(200).json({ success: true, tripLeaders });
});

export const addRatingAndComment = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  const trip = await tripModel.findById(tripId);
  if (!trip) {
    return res.status(404).json({ success: false, message: "Trip not found" });
  }
  const leader = await tripLeaderModel.findById(trip.tripLeaderId);
  if (!leader) {
    return next(new Error("Trip leader not found !", { status: 404 }));
  }
  const newRating = await ratingModel.create({
    user: userId,
    rating,
    comment,
    trip: tripId,
    leader,
  });

  leader.ratings.push(newRating._id);
  await leader.recalculateAverageRating();

  res.status(201).json({
    success: true,
    message: "Rating added successfully",
  });
});

export const updateTripLeaderPassword = asyncHandler(async (req, res, next) => {
  const { newPassword, confirmNewPassword } = req.body;

  if (!newPassword || !confirmNewPassword) {
    return next(
      new Error("New password and confirm password are required", {
        status: 400,
      })
    );
  }

  if (newPassword !== confirmNewPassword) {
    return next(
      new Error("New password and confirm password do not match", {
        status: 400,
      })
    );
  }

  const tripLeader = await tripLeaderModel.findById(req.tripLeader._id);

  if (!tripLeader) {
    return next(new Error("Trip leader not found", { status: 404 }));
  }
  tripLeader.password = newPassword;
  tripLeader.isUpdated = true;
  await tripLeader.save();

  return res.status(200).json({
    success: true,
    message: "Password updated successfully!",
  });
});

export const completeProfile = asyncHandler(async (req, res, next) => {
  const {
    name,
    N_id,
    phone,
    userName,
    license,
    expirationDate,
    createTrip,
    typeId,
    IDExpireDate,
  } = req.body;
  const tripLeaderId = req.tripLeader._id;

  const tripLeader = await tripLeaderModel.findById(tripLeaderId);

  if (!tripLeader) {
    return next(new Error("Trip Leader not found", { cause: 404 }));
  }

  const files = req.files;
  let images = {};

  if (files) {
    if (files.IDPhoto) {
      const result = await cloudinary.uploader.upload(files.IDPhoto[0].path, {
        folder: "tripLeaders/IDPhotos",
      });
      images.IDPhoto = { url: result.secure_url, id: result.public_id };
    }
    if (files.FictionAndSimile) {
      const result = await cloudinary.uploader.upload(
        files.FictionAndSimile[0].path,
        {
          folder: "tripLeaders/FictionAndSimile",
        }
      );
      images.FictionAndSimile = {
        url: result.secure_url,
        id: result.public_id,
      };
    }
    if (files.MaintenanceGuarantee) {
      const result = await cloudinary.uploader.upload(
        files.MaintenanceGuarantee[0].path,
        {
          folder: "tripLeaders/MaintenanceGuarantee",
        }
      );
      images.MaintenanceGuarantee = {
        url: result.secure_url,
        id: result.public_id,
      };
    }
    if (files.DrugAnalysis) {
      const result = await cloudinary.uploader.upload(
        files.DrugAnalysis[0].path,
        {
          folder: "tripLeaders/DrugAnalysis",
        }
      );
      images.DrugAnalysis = { url: result.secure_url, id: result.public_id };
    }
    if (files.profileImage) {
      const result = await cloudinary.uploader.upload(
        files.profileImage[0].path,
        {
          folder: "tripLeaders/profileImage",
        }
      );
      images.profileImage = { url: result.secure_url, id: result.public_id };
    }
  }

  tripLeader.name = name || tripLeader.name;
  tripLeader.userName = userName || tripLeader.userName;
  tripLeader.phone = phone || tripLeader.phone;
  tripLeader.N_id = N_id || tripLeader.N_id;
  tripLeader.license = license || tripLeader.license;
  tripLeader.expirationDate = expirationDate || tripLeader.expirationDate;
  tripLeader.createTrip = createTrip || tripLeader.createTrip;
  tripLeader.typeId = typeId || tripLeader.typeId;
  tripLeader.IDPhoto = images.IDPhoto || tripLeader.IDPhoto;
  tripLeader.FictionAndSimile =
    images.FictionAndSimile || tripLeader.FictionAndSimile;
  tripLeader.MaintenanceGuarantee =
    images.MaintenanceGuarantee || tripLeader.MaintenanceGuarantee;
  tripLeader.DrugAnalysis = images.DrugAnalysis || tripLeader.DrugAnalysis;
  tripLeader.profileImage = images.profileImage || tripLeader.profileImage;
  tripLeader.IDExpireDate = IDExpireDate || tripLeader.IDExpireDate;
  tripLeader.infoUpdate = "true";
  tripLeader.status = "active";

  await tripLeader.save();

  if (tripLeader.ownerId) {
    const owner = await OwnerModel.findById(tripLeader.ownerId);
    if (owner) {
      await notificationModel.create({
        title: "Trip Leader Profile Completed",
        description: `${tripLeader.name} has successfully completed their profile.`,
        receiver: owner._id,
        receiverModel: "Owner",
      });
    }
  }
  // Generate token
  const token = jwt.sign(
    {
      id: tripLeader._id,
      phone: tripLeader.phone,
      tripLeader: tripLeader.role,
    },
    process.env.TOKEN_SIGNATURE
  );
  await tokenModel.create({
    token,
    user: tripLeader._id,
    agent: req.headers["user-agent"],
  });
  return res.status(200).json({
    success: true,
    message: "Trip Leader profile updated successfully",
    data: {
      token,
      fullName: tripLeader.name,
      nationalID: tripLeader.N_id,
      phone: tripLeader.phone,
      userName: tripLeader.userName,
      role: tripLeader.role,
      isUpdated: tripLeader.isUpdated,
      profileImage: tripLeader.profileImage,
      isDate: tripLeader.isDate,
      isUpdated: tripLeader.isUpdated,
      infoUpdate: tripLeader.infoUpdate,
      IDExpireDate: tripLeader.IDExpireDate,
      id: tripLeader._id,
    },
  });
});

export const start = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;

  const trip = await tripModel.findById(tripId);

  if (!trip) {
    return next(new Error("Trip not found", { status: 404 }));
  }

  if (trip.status !== "upComing") {
    return res.status(400).json({
      success: false,
      message: "You can't satart this trip !",
    });
  }

  trip.status = "current";
  await trip.save();

  res.status(200).json({
    success: true,
    message: "Trip Started!",
  });
});

export const cancelTrip = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;

  const trip = await tripModel.findById(tripId);

  if (!trip) {
    return next(new Error("Trip not found", { status: 404 }));
  }

  trip.status = "cancelled";
  await trip.save();

  res.status(200).json({
    success: true,
    message: "Trip cancelled !",
  });
});

export const finishTrip = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;

  const trip = await tripModel.findById(tripId);

  if (!trip) {
    return next(new Error("Trip not found", { status: 404 }));
  }

  if (trip.status === "completed") {
    return res.status(400).json({
      success: false,
      message: "Trip is already completed",
    });
  }

  if (trip.status !== "current") {
    return res.status(400).json({
      success: false,
      message: "Trip can only be completed if its status is 'current'",
    });
  }

  const ownerEarnings = trip.totalEarnings * 0.5;
  const tripLeaderEarnings = trip.totalEarnings * 0.45;

  const owner = await OwnerModel.findById(trip.createdBy);
  const tripLeader = await tripLeaderModel.findById(trip.tripLeaderId);

  if (!owner || !tripLeader) {
    return next(new Error("Owner or Trip Leader not found", { status: 404 }));
  }

  owner.wallet.balance += ownerEarnings;
  owner.wallet.TotalDeposit += ownerEarnings;
  await owner.save();

  tripLeader.wallet.balance += tripLeaderEarnings;
  tripLeader.wallet.TotalDeposit += tripLeaderEarnings;
  await tripLeader.save();

  trip.status = "completed";
  await trip.save();

  res.status(200).json({
    success: true,
    message: "Trip completed and earnings distributed!",
  });
});

export const rateDetails = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;

  const trip = await tripModel.findById(tripId);
  if (!trip) {
    return next(new Error("Trip not found", { status: 404 }));
  }

  const captin = await tripLeaderModel
    .findById(trip.tripLeaderId)
    .select("name profileImage averageRating tripsCounter");

  const ratings = await ratingModel
    .find({ leader: captin._id, trip: tripId })
    .select("comment rating createdAt")
    .populate("user", "profileImage fullName");

  res.status(200).json({
    success: true,
    tripCover: trip.defaultImage,
    captin,
    averageRating: trip.averageRating,
    ratingsLength: ratings.length,
    ratings,
  });
});

export const deactivateTripLeader = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const ownerId = req.owner._id;

  const tripLeader = await tripLeaderModel.findById(id);
  if (!tripLeader) {
    return next(new Error("TripLeader not found", { status: 404 }));
  }

  if (tripLeader.ownerId.toString() !== ownerId.toString()) {
    return next(new Error("Unauthorized", { status: 403 }));
  }

  if (tripLeader.status === "Inactive") {
    return res.status(400).json({ message: "TripLeader is already Inactive" });
  }

  tripLeader.status = "Inactive";
  await tripLeader.save();

  res.status(200).json({
    success: true,
    message: "TripLeader status changed to Inactive",
  });
});

export const activateTripLeader = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const ownerId = req.owner._id;

  const tripLeader = await tripLeaderModel.findById(id);
  if (!tripLeader) {
    return next(new Error("TripLeader not found", { status: 404 }));
  }

  if (tripLeader.ownerId.toString() !== ownerId.toString()) {
    return next(new Error("Unauthorized", { status: 403 }));
  }

  if (tripLeader.status === "active") {
    return res.status(400).json({ message: "TripLeader is already active" });
  }

  tripLeader.status = "active";
  await tripLeader.save();

  res.status(200).json({
    success: true,
    message: "TripLeader status changed to active",
  });
});

export const deleteTripLeader = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const ownerId = req.owner._id;

  const tripLeader = await tripLeaderModel.findById(id);
  if (!tripLeader) {
    return next(new Error("TripLeader not found", { status: 404 }));
  }

  if (tripLeader.ownerId.toString() !== ownerId.toString()) {
    return next(new Error("Unauthorized", { status: 403 }));
  }

  await tripLeader.remove();

  res.status(200).json({
    success: true,
    message: "TripLeader deleted successfully",
  });
});

export const editLeaderInfo = asyncHandler(async (req, res, next) => {
  const ownerId = req.owner._id;
  const { tripLeaderId } = req.params;
  const { expirationDate, IDExpireDate } = req.body;

  const tripLeader = await tripLeaderModel.findById(tripLeaderId);

  if (!tripLeader) {
    return next(new Error("Trip Leader not found", { cause: 404 }));
  }

  const files = req.files;
  let images = {};

  if (files) {
    if (files.IDPhoto) {
      const result = await cloudinary.uploader.upload(files.IDPhoto[0].path, {
        folder: "tripLeaders/IDPhotos",
      });
      images.IDPhoto = { url: result.secure_url, id: result.public_id };
    }
  }
  tripLeader.expirationDate = expirationDate || tripLeader.expirationDate;
  tripLeader.IDExpireDate = IDExpireDate || tripLeader.IDExpireDate;
  tripLeader.IDPhoto = images.IDPhoto || tripLeader.IDPhoto;

  await tripLeader.save();
  res.status(200).json({ success: true, message: "successfully updated" });
});

export const leaederInfo = asyncHandler(async (req, res, next) => {
  const ownerId = req.owner._id;
  const { tripLeaderId } = req.params;

  const tripLeader = await tripLeaderModel
    .findById(tripLeaderId)
    .select(
      "_id name userName N_id phone license expirationDate typeId profileImage IDPhoto IDExpireDate FictionAndSimile DrugAnalysis MaintenanceGuarantee"
    );

  if (!tripLeader) {
    return next(new Error("Trip Leader not found", { cause: 404 }));
  }

  const isIdExpired =
    tripLeader.IDExpireDate && tripLeader.IDExpireDate < new Date();
  const isLicenseExpired =
    tripLeader.expirationDate && tripLeader.expirationDate < new Date();

  // Determine language preference based on Accept-Language header
  const preferredLanguage = req.headers["accept-language"]?.startsWith("ar")
    ? "ar"
    : "en";

  // Search for typeId in typeOfTypeModel
  let typeName;
  if (tripLeader.typeId) {
    const typeRecord = await typesOfPlacesModel
      .findById(tripLeader.typeId)
      .select(`name_${preferredLanguage}`);
    if (typeRecord) {
      // If found in typeOfTypeModel, use it
      typeName = typeRecord[`name_${preferredLanguage}`];
    } else {
      // Otherwise, fallback to predefinedTypes list
      const typeInfo = predefinedTypes.find(
        (type) => type.id === tripLeader.typeId.toString()
      );
      typeName = typeInfo ? typeInfo.name[preferredLanguage] : null;
    }
  }

  const leaderInfo = {
    _id: tripLeader._id,
    name: tripLeader.name,
    userName: tripLeader.userName,
    N_id: tripLeader.N_id,
    phone: tripLeader.phone,
    license: tripLeader.license,
    expirationDate: tripLeader.expirationDate,
    typeId: tripLeader.typeId ? { name: typeName } : null,
    profileImage: tripLeader.profileImage,
    IDPhoto: tripLeader.IDPhoto,
    IDExpireDate: tripLeader.IDExpireDate,
    FictionAndSimile: tripLeader.FictionAndSimile,
    DrugAnalysis: tripLeader.DrugAnalysis,
    MaintenanceGuarantee: tripLeader.MaintenanceGuarantee,
    isIdExpired,
    isLicenseExpired,
  };

  res.status(200).json({ success: true, data: leaderInfo });
});
