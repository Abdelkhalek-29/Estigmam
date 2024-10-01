import { asyncHandler } from "../../../utils/errorHandling.js";
import tripLeaderModel from "../../../../DB/model/tripLeader.model.js";
import Randomstring from "randomstring";
import tripModel from "../../../../DB/model/Trip.model.js";
import ratingModel from "../../../../DB/model/rating.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import OwnerModel from "../../../../DB/model/Owner.model .js";

export const addTripLeader = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;

  if (!Array.isArray(phone) || phone.length === 0) {
    return next(
      new Error("The 'phones' field must be a non-empty array.", {
        status: 400,
      })
    );
  }

  const existingLeaders = await tripLeaderModel.find({ phone: { $in: phone } });
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

  const newLeaders = phone.map((phone) => ({
    phone,
    password: Randomstring.generate({ length: 8 }),
    ownerId: req.owner._id,
  }));

  const createdLeaders = await tripLeaderModel.insertMany(newLeaders);

  return res.status(201).json({
    success: true,
    message: "Message sent to trip leaders!",
    leaders: createdLeaders.map((leader) => ({
      phone: leader.phone,
      password: leader.password,
    })),
  });
});

export const getAllLeaders = asyncHandler(async (req, res, next) => {
  const ownerId = req.owner._id;

  const tripLeaders = await tripLeaderModel.find({ ownerId });

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
  const { name,N_id,phone,userName,license, expirationDate, createTrip, section } = req.body;
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
      const result = await cloudinary.uploader.upload(files.FictionAndSimile[0].path, {
        folder: "tripLeaders/FictionAndSimile",
      });
      images.FictionAndSimile = { url: result.secure_url, id: result.public_id };
    }
    if (files.MaintenanceGuarantee) {
      const result = await cloudinary.uploader.upload(files.MaintenanceGuarantee[0].path, {
        folder: "tripLeaders/MaintenanceGuarantee",
      });
      images.MaintenanceGuarantee = { url: result.secure_url, id: result.public_id };
    }
    if (files.DrugAnalysis) {
      const result = await cloudinary.uploader.upload(files.DrugAnalysis[0].path, {
        folder: "tripLeaders/DrugAnalysis",
      });
      images.DrugAnalysis = { url: result.secure_url, id: result.public_id };
    }
    if (files.profileImage) {
      const result = await cloudinary.uploader.upload(files.profileImage[0].path, {
        folder: "tripLeaders/profileImage",
      });
      images.profileImage = { url: result.secure_url, id: result.public_id };
    }
  }

  tripLeader.name=name||tripLeader.name
  tripLeader.userName=userName||tripLeader.userName
  tripLeader.phone=phone||tripLeader.phone
  tripLeader.N_id=N_id||tripLeader.N_id
  tripLeader.license = license || tripLeader.license;
  tripLeader.expirationDate = expirationDate || tripLeader.expirationDate;
  tripLeader.createTrip = createTrip || tripLeader.createTrip;
  tripLeader.section = section || tripLeader.section;

  tripLeader.IDPhoto = images.IDPhoto || tripLeader.IDPhoto;
  tripLeader.FictionAndSimile = images.FictionAndSimile || tripLeader.FictionAndSimile;
  tripLeader.MaintenanceGuarantee = images.MaintenanceGuarantee || tripLeader.MaintenanceGuarantee;
  tripLeader.DrugAnalysis = images.DrugAnalysis || tripLeader.DrugAnalysis;
  tripLeader.profileImage = images.profileImage || tripLeader.profileImage;

  await tripLeader.save();

  return res.status(200).json({
    success: true,
    message: "Trip Leader profile updated successfully",
    data: tripLeader,
  });
});




export const start = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;

  const trip = await tripModel.findById(tripId);

  if (!trip) {
    return next(new Error("Trip not found", { status: 404 }));
  }

  trip.status = "current";
  await trip.save();

  res.status(200).json({
    success: true,
    message: "Trip Started !",
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

  const ownerEarnings = trip.totalEarnings * 0.5;
  const tripLeaderEarnings = trip.totalEarnings * 0.45;

  const owner = await ownerModel.findById(trip.createdBy);
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
