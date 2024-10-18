import categoryModel from "../../../../DB/model/category.model.js";
import subCategoryModel from "../../../../DB/model/places.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import cloudinary from "../../../utils/cloudinary.js";
import { nanoid } from "nanoid";
import tripModel from "../../../../DB/model/Trip.model.js";
import userModel from "../../../../DB/model/User.model.js";
import transactionsModel from "../../../../DB/model/transactions.model.js";
import moment from "moment";
import OwnerModel from "../../../../DB/model/Owner.model .js";
import tripLeaderModel from "../../../../DB/model/tripLeader.model.js";
import toolModel from "../../../../DB/model/tool.model.js";
import placesModel from "../../../../DB/model/places.model.js";
import randomstring from "randomstring";
import typesOfPlacesModel from "../../../../DB/model/typesOfPlaces.model.js";
import bannerModel from "../../../../DB/model/banner.model.js";
import ratingModel from "../../../../DB/model/rating.model.js";
import { haversineDistance } from "../../../utils/distance.js";
import cityModel from "../../../../DB/model/city.model.js";
import additionModel from "../../../../DB/model/addition.model.js";
import bedTypeModel from "../../../../DB/model/bedType.model.js";
import activityModel from "../../../../DB/model/activity.model.js";
import conversationModel from "../../../../DB/model/conversation.model.js";
import GroupChat from "../../../../DB/model/groupChat,model.js";
import berthModel from "../../../../DB/model/berth.model.js";
import { getRandomLocationInCircle } from "../../../utils/RandomLocation.js";

/*export const createTrip = asyncHandler(async (req, res, next) => {
  if (!req.files) {
    return res.status(401).json({ message: "No data provided" });
  }
  const {
    startDate,
    endDate,
    description,
    peopleNumber,
    tripTitle,

    priceMember,
    descriptionAddress,
    offer,
    category,
    subCategory,
  } = req.body;
  const categoryExist = await categoryModel.findById(category);
  if (!categoryExist) {
    return next(new Error("Category not found!", { cause: 404 }));
  }

  const subCategoryExist = await subCategoryModel.findById(subCategory);
  if (!subCategoryExist) {
    return next(new Error("SubCategory not found!", { cause: 404 }));
  }
  if (!req.files) {
    return next(new Error("trip images is required", { cause: 400 }));
  }
  const cloudFolder = nanoid();
  let images = [];
  for (const file of req.files.subImages) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      { folder: `${process.env.FOLDER_CLOUDINARY}/Trips/${cloudFolder}` }
    );
    images.push({ url: secure_url, id: public_id });
  }

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.files.defaultImage[0].path,
    {
      folder: `${process.env.FOLDER_CLOUDINARY}/Trips/${cloudFolder}`,
    }
  );

  const trip = await tripModel.create({
    startDate,
    endDate,
    description,
    peopleNumber,
    tripTitle,
    priceMember,
    offer,
    category,
    subCategory,
    berth: {
      Longitude: parseFloat(req.body.Latitude),
      Latitude: parseFloat(req.body.Longitude),
    },
    descriptionAddress,
    cloudFolder,
    createdBy: req.owner._id,
    defaultImage: { url: secure_url, id: public_id },
    subImages: images,
    numberOfPeopleAvailable: peopleNumber,
  });
  if (trip.offer > 0) {
    trip.priceAfterOffer = trip.finalPrice;
    await trip.save();
  }
  await OwnerModel.findByIdAndUpdate(req.owner._id, {
    $inc: { numberTrip: 1 },
  });
  return res.status(201).json({ success: true, trip });
});*/

export const createTrip = asyncHandler(async (req, res, next) => {
  const {
    startDate,
    endDate,
    peopleNumber,
    startLocation,
    endLocation,
    offer,
    berh,
    descriptionAddress,
    tripTitle,
    description,
    priceMember,
    addition = [],
    bedType = [],
    category,
    typeOfPlace,
    activity,
    equipmentId,
    tripLeaderId,
    cityId,
  } = req.body;

  const additionArray = Array.isArray(addition) ? addition : [addition];
  const bedTypeArray = Array.isArray(bedType) ? bedType : [bedType];

  for (const addId of additionArray) {
    const add = await additionModel.findById(addId);
    if (!add) {
      return next(new Error("Addition not found", { cause: 404 }));
    }
  }

  for (const bedTypeId of bedTypeArray) {
    const bed = await bedTypeModel.findById(bedTypeId);
    if (!bed) {
      return next(new Error("BedType not found", { cause: 404 }));
    }
  }

  const type = await typesOfPlacesModel.findById(typeOfPlace);
  if (!type) {
    return next(new Error("TypeOfPlace not found", { cause: 404 }));
  }

  const categoryExist = await categoryModel.findById(category);
  if (!categoryExist) {
    return next(new Error("Category not found", { cause: 404 }));
  }

  const cityExist = await cityModel.findById(cityId);
  if (!cityExist) {
    return next(new Error("City not found", { cause: 404 }));
  }

  const tripCode = randomstring.generate({
    length: 7,
    charset: "numeric",
  });

  const priceAfterOffer = Number.parseFloat(
    priceMember - (priceMember * offer || 0) / 100
  ).toFixed(2);

  const startCoords = {
    latitude: startLocation.Latitude,
    longitude: startLocation.Longitude,
  };
  const endCoords = {
    latitude: endLocation.Latitude,
    longitude: endLocation.Longitude,
  };
  const distance = haversineDistance(startCoords, endCoords).toFixed(2);

  const newTrip = new tripModel({
    startDate,
    endDate,
    priceAfterOffer,
    peopleNumber,
    startLocation,
    endLocation,
    berh,
    descriptionAddress,
    tripTitle,
    description,
    priceMember,
    addition: additionArray,
    bedType: bedTypeArray,
    category,
    typeOfPlace,
    activity,
    cityId,
    tripCode,
    distance,
    numberOfPeopleAvailable: peopleNumber,
    isCustomized: true, // Set isCustomized to true here
  });

  const city = await cityModel.findById(newTrip.cityId);
  newTrip.city = city.name;

  const ownerId = req.owner?._id;
  const userId = req.user?._id;

  if (ownerId) {
    const tripLeader = await tripLeaderModel.findOne({
      _id: tripLeaderId,
      ownerId,
    });

    if (!tripLeader) {
      return next(
        new Error("Trip leader does not belong to this owner", { cause: 403 })
      );
    }

    let equipment;

    equipment = await toolModel.findById(equipmentId);
    if (!equipment) {
      equipment = await placesModel.findById(equipmentId);
      if (!equipment) {
        equipment = await activityModel.findById(equipmentId);
        if (!equipment) {
          return next(new Error("Equipment not found", { cause: 404 }));
        }
      }
    }
    const defaultImage = equipment.toolImage
      ? equipment.toolImage[0]
      : equipment.images[0];
    const subImages = equipment.toolImage
      ? equipment.toolImage.slice(1)
      : equipment.images.slice(1);

    newTrip.createdBy = ownerId;
    newTrip.tripLeaderId = tripLeaderId;
    newTrip.equipmentId = equipmentId;
    newTrip.defaultImage = defaultImage;
    newTrip.subImages = subImages;
    newTrip.offer = offer;
    newTrip.status = "confirmed";
    await newTrip.save();

    await GroupChat.create({
      tripId: newTrip._id,
      groupName: newTrip.tripTitle,
      participants: [tripLeaderId],
      lastMessage: {
        text: "Welcome to the trip!",
        senderId: tripLeaderId,
        seen: false,
      },
    });
  } else if (userId) {
    newTrip.userId = userId;
    newTrip.status = "pending";
    await newTrip.save();
  }

  res.status(201).json({
    success: true,
    message: ownerId
      ? "Trip created successfully"
      : "Plan New Trip created successfully, waiting for approval",
  });
});

export const BookedTrip = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const { BookedTicket } = req.body;
  const userId = req.user._id;

  const trip = await tripModel.findById(tripId);
  if (!trip) {
    return res.status(400).json({ success: false, message: "Trip not found" });
  }

  const user = await userModel.findById(userId);
  if (!user) {
    return res.status(400).json({ success: false, message: "User not found" });
  }

  if (trip.priceAfterOffer * BookedTicket > user.wallet.balance) {
    return res.status(400).json({
      success: false,
      message: "Your balance is not enough to book this trip",
    });
  }

  await userModel.findByIdAndUpdate(
    userId,
    { $addToSet: { Booked: { tripId, BookedTicket } } },
    { new: true }
  );

  const totalCost = trip.priceAfterOffer * BookedTicket;
  await userModel.findByIdAndUpdate(
    userId,
    {
      $inc: {
        "wallet.balance": -totalCost,
        "wallet.TotalWithdraw": totalCost,
      },
    },
    { new: true }
  );

  const transactionId = randomstring.generate({
    length: 7,
    charset: "numeric",
  });
  const transaction = await transactionsModel.create({
    userId,
    price: totalCost,
    nameTransaction: trip.tripTitle,
    status: "Withdraw",
    type: "Wallet",
    transactionId,
  });

  trip.numberOfPeopleAvailable -= BookedTicket;
  trip.totalEarnings += totalCost;
  await trip.save();

  transaction.date = moment(transaction.createdAt).format("MM/DD/YYYY");
  await transaction.save();

  let chatGroup = await GroupChat.findOne({ tripId });

  if (!chatGroup) {
    chatGroup = await GroupChat.create({
      tripId,
      groupName:"test group chat",
      participants: [userId],
      lastMessage: {
        text: "Welcome to the trip!",
        senderId: userId,
        seen: false,
      },
    });
  } else {
    if (
      !chatGroup.participants.some(
        (participant) => participant.toString() === userId.toString()
      )
    ) {
      chatGroup.participants.push(userId);
      await chatGroup.save();
    }
  }

  res.status(200).json({
    success: true,
    message: "The trip has been booked successfully",
    transactionCode: transaction.transactionId,
  });
});

export const deleteTrip = asyncHandler(async (req, res, next) => {
  const ownerId = req.owner?._id;
  const userId = req.user?._id;
  if (ownerId) {
    const trip = await tripModel.findById(req.params.tripId);
    if (!trip) {
      return next(new Error("tripId not found", { cause: 404 }));
    }

    if (ownerId.toString() !== trip.createdBy.toString()) {
      return next(new Error("not authorized", { cause: 401 }));
    }
    const ids = trip.subImages.map((image) => image.id);
    ids.push(trip.defaultImage.id);
    const result = await cloudinary.api.delete_resources(ids);
    await cloudinary.api.delete_folder(
      `${process.env.FOLDER_CLOUDINARY}/Trips/${trip.cloudFolder}`
    );

    await tripModel.findByIdAndDelete(req.params.tripId);
    // await OwnerModel.findByIdAndUpdate(ownerId, {
    //   $inc: { numberTrip: -1 },
    // });
  } else if (userId) {
    const trip = await tripModel.findById(req.params.tripId);
    if (!trip) {
      return next(new Error("tripId not found", { cause: 404 }));
    }
    if (userId.toString() !== trip.userId.toString()) {
      return next(new Error("not authorized", { cause: 401 }));
    }
    trip.status = "cancelled";
    await trip.save();
  }
  return res.status(200).json({
    success: true,
    message: req.owner
      ? "trip delete successfully!"
      : "trip canceled successfully!",
  });
});

export const getallTrip = asyncHandler(async (req, res, next) => {
  const language = req.query.lang || req.headers["accept-language"] || "en";
  const nameField = language === "ar" ? "name_ar" : "name_en";

  const trips = await tripModel
    .find({ ...req.query })
    .populate({
      path: "tripLeaderId",
      select: "name profileImage tripsCounter ",
      ref: "TripLeader",
    })
    .populate({
      path: "addition",
      select: "name",
      ref: "Addition",
    })
    .populate({
      path: "bedType",
      select: "name",
      ref: "BedType",
    })
    .populate({
      path: "typeOfPlace",
      select: nameField,
      ref: "TypesOfPlaces",
    })
    .populate({
      path: "category",
      select: nameField,
      ref: "Category",
    })
    .pagination(req.query.page)
    .customSelect(req.query.fields)
    .sort(req.query.sort);
  return res.status(200).json({ success: true, trips });
});
export const getTrip = asyncHandler(async (req, res, next) => {
  const language = req.query.lang || req.headers["accept-language"] || "en";
  const nameField = language === "ar" ? "name_ar" : "name_en";

  const trip = await tripModel
    .findById(req.params.tripId)
    .populate({
      path: "tripLeaderId",
      select: "name profileImage tripsCounter averageRating",
    })
    .populate({
      path: "addition",
      select: "name",
    })
    .populate({
      path: "bedType",
      select: "name",
    })
    .populate({
      path: "typeOfPlace",
      select: `${nameField}`,
    })
    .populate({
      path: "category",
      select: `${nameField}`,
    });

  if (!trip) {
    return next(new Error("Trip not found", { cause: 404 }));
  }

  let isFavourite = false;
  if (req.user) {
    const user = await userModel.findById(req.user._id).populate("Likes");
    if (user) {
      isFavourite = user.Likes.some(
        (like) => like._id.toString() === trip._id.toString()
      );
    }
  }

  const tripWithFavourite = {
    ...trip.toJSON(),
    isFavourite,
  };

  if (tripWithFavourite.typeOfPlace) {
    tripWithFavourite.typeOfPlace.name =
      tripWithFavourite.typeOfPlace[nameField];
    delete tripWithFavourite.typeOfPlace[nameField];
  }

  if (tripWithFavourite.category) {
    tripWithFavourite.category.name = tripWithFavourite.category[nameField];
    delete tripWithFavourite.category[nameField];
  }

  res.status(200).json({
    success: true,
    trip: tripWithFavourite,
  });
});

export const redHeart = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const trip = await tripModel.findById(tripId);
  if (!trip) {
    return res.status(400).json({ success: false, message: "trip not found" });
  }
  const user = await userModel.findById(req.user._id);
  if (!user) {
    return res.status(400).json({ success: false, message: "User not found" });
  }
  const isLike = user.Likes && user.Likes.includes(tripId);
  const option = isLike ? "$pull" : "$addToSet";
  await tripModel.findOneAndUpdate(
    { _id: tripId },
    { [option]: { Likes: req.user._id } },
    { new: true }
  );
  await userModel.findOneAndUpdate(
    { _id: req.user._id },
    { [option]: { Likes: tripId } },
    { new: true }
  );
  return res.status(200).json({
    success: true,
    status: 200,
    message: isLike
      ? "This post has been removed from the wishlist"
      : "This post has been added to the wishlist",
  });
});

export const wishlist = asyncHandler(async (req, res, next) => {
  const language = req.query.lang || req.headers["accept-language"] || "en";
  const nameField = language === "ar" ? "name_ar" : "name_en";

  // Fetch the user with populated fields
  let user = await userModel.findById(req.user._id).populate({
    path: "Likes",
    model: "Trip",
    populate: [
      {
        path: "tripLeaderId",
        select: "name profileImage tripsCounter averageRating",
        model: "TripLeader",
      },
      {
        path: "addition",
        select: "name",
        model: "Addition",
      },
      {
        path: "bedType",
        select: "name",
        model: "BedType",
      },
      {
        path: "typeOfPlace",
        select: nameField,
        model: "TypesOfPlaces",
      },
      {
        path: "category",
        select: nameField,
        model: "Category",
      },
    ],
  });

  if (!user) {
    return next(new Error("User not found", { status: 404 }));
  }

  const updatedLikes = user.Likes.map((trip) => {
    const categoryName = trip.category ? trip.category[nameField] : undefined;
    const typeOfPlaceName = trip.typeOfPlace
      ? trip.typeOfPlace[nameField]
      : undefined;

    return {
      ...trip.toObject(),
      category: trip.category
        ? {
            _id: trip.category._id,
            name: categoryName,
          }
        : null,
      typeOfPlace: trip.typeOfPlace
        ? {
            _id: trip.typeOfPlace._id,
            name: typeOfPlaceName,
          }
        : null,
    };
  });

  return res.status(200).json({
    success: true,
    status: 200,
    message: "These are all the products that you added to the wishlist",
    data: updatedLikes,
  });
});

export const getTripByOffer = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const trips = await tripModel
    .find({
      offer: { $gt: 0 },
      category: categoryId,
    })
    .populate({
      path: "tripLeaderId",
      select: "name profileImage tripsCounter averageRating ",

      ref: "TripLeader",
    })
    .populate({
      path: "addition",
      select: "name",
      ref: "Addition",
    })
    .populate({
      path: "bedType",
      select: "name",
      ref: "BedType",
    })
    .populate({
      path: "typeOfPlace",
      select: " name",
      ref: "TypesOfPlaces",
    })
    .populate({
      path: "category",
      select: "name",
      ref: "Category",
    });
  if (!trips) {
    return next(new Error("No offers found", { status: 404 }));
  }
  res.status(200).json({
    success: true,
    data: trips,
  });
});

export const getByTypes = asyncHandler(async (req, res, next) => {
  const { typeOfPlaceId } = req.params;
  const { city, sortBy, sortOrder } = req.query;

  const language = req.query.lang || req.headers["accept-language"] || "en";
  const nameField = language === "ar" ? "name_ar" : "name_en";

  const user = req.user
    ? await userModel.findById(req.user._id).populate("Likes").populate("city")
    : null;

  const sortOptions = {};
  if (sortBy) {
    if (sortBy === "peopleNumber") {
      sortOptions["peopleNumber"] = sortOrder === "desc" ? -1 : 1;
    } else if (sortBy === "priceAfterOffer") {
      sortOptions["priceAfterOffer"] = sortOrder === "desc" ? -1 : 1;
    } else if (sortBy === "averageRating") {
      sortOptions["tripLeaderId.averageRating"] = sortOrder === "desc" ? -1 : 1;
    }
  }

  const query = { typeOfPlace: typeOfPlaceId };

  if (city) {
    const cityRecord = await cityModel.findOne({ name: city }).exec();
    if (cityRecord) {
      query.cityId = cityRecord._id;
    }
  }

  let trips = await tripModel
    .find(query)
    .sort(sortOptions)
    .populate({
      path: "tripLeaderId",
      select: "name profileImage tripsCounter averageRating",
      ref: "TripLeader",
    })
    .populate({
      path: "addition",
      select: "name",
      ref: "Addition",
    })
    .populate({
      path: "bedType",
      select: "name",
      ref: "BedType",
    })
    .populate({
      path: "typeOfPlace",
      select: nameField,
      ref: "TypesOfPlaces",
    })
    .populate({
      path: "category",
      select: nameField,
      ref: "Category",
    });

  if (sortBy === "distance" && user && user.city && user.city.location) {
    const userCoords = {
      latitude: user.city.location.Latitude,
      longitude: user.city.location.Longitude,
    };
    trips = trips.map((trip) => {
      const tripCoords = {
        latitude: trip.startLocation.Latitude,
        longitude: trip.startLocation.Longitude,
      };
      trip.distance = haversineDistance(userCoords, tripCoords);
      return trip;
    });

    trips.sort((a, b) => {
      return sortOrder === "desc"
        ? b.distance - a.distance
        : a.distance - b.distance;
    });
  } else if (sortBy === "tripDuration") {
    trips.sort((a, b) => {
      const aDuration =
        a.tripDuration.days * 24 * 60 +
        a.tripDuration.hours * 60 +
        a.tripDuration.minutes;
      const bDuration =
        b.tripDuration.days * 24 * 60 +
        b.tripDuration.hours * 60 +
        b.tripDuration.minutes;
      return sortOrder === "desc"
        ? bDuration - aDuration
        : aDuration - bDuration;
    });
  } else if (sortBy === "averageRating") {
    trips.sort((a, b) => {
      return sortOrder === "desc"
        ? b.tripLeaderId.averageRating - a.tripLeaderId.averageRating
        : a.tripLeaderId.averageRating - b.tripLeaderId.averageRating;
    });
  } else {
    trips.sort((a, b) => {
      for (const key in sortOptions) {
        if (sortOptions[key] !== 0) {
          if (a[key] < b[key]) return sortOptions[key] * -1;
          if (a[key] > b[key]) return sortOptions[key];
        }
      }
      return 0;
    });
  }

  let userLikes = [];
  if (user) {
    userLikes = user.Likes.map((like) => like._id.toString());
  }

  const tripsWithFavourite = trips.map((trip) => {
    const tripObject = trip.toJSON();
    const isFavourite = userLikes.includes(tripObject._id.toString());

    if (tripObject.typeOfPlace) {
      tripObject.typeOfPlace.name = tripObject.typeOfPlace[nameField];
      delete tripObject.typeOfPlace[nameField];
    }

    if (tripObject.category) {
      tripObject.category.name = tripObject.category[nameField];
      delete tripObject.category[nameField];
    }

    return {
      ...tripObject,
      isFavourite,
    };
  });

  res.status(200).json({
    success: true,
    data: tripsWithFavourite,
  });
});
/*export const getRate=asyncHandler(async(req.res.next) => {
  const { tripId } = req.params;

  const trip = await tripModel.findById(tripId);
  if (!trip) {
    return next(new Error("Entered trip not found !", { status: 404 }));
  }

})*/

export const home = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const language = req.query.lang || req.headers["accept-language"] || "en";

  const nameField = language === "ar" ? "name_ar" : "name_en";

  // Fetch types for the given category
  const types = await typesOfPlacesModel
    .find({ categoryId })
    .select(`${nameField} image`);

  if (!types || types.length === 0) {
    return next(new Error("Types not found", { status: 404 }));
  }

  // Fetch trips with offers for the given category
  const trips = await tripModel
    .find({ offer: { $gt: 0 }, category: categoryId })
    .populate("tripLeaderId", "name profileImage tripsCounter averageRating")
    .populate("addition", "name")
    .populate("bedType", "name")
    .populate({
      path: "typeOfPlace",
      select: `${nameField} _id`,
    })
    .populate({
      path: "category",
      select: `${nameField} _id`,
    })
    .populate({
      path: "activity",
      select: `_id ${nameField} type`,
      populate: {
        path: "type",
        select: `${nameField} _id`,
      },
      options: { strictPopulate: false }, // Allow population for non-schema fields
    });

  if (!trips || trips.length === 0) {
    return next(new Error("No offers found", { status: 404 }));
  }

  const banner = await bannerModel.find({ categoryId });
  if (!banner || banner.length === 0) {
    return next(new Error("Banner not found!", { status: 404 }));
  }

  let userLikes = [];
  if (req.user) {
    const user = await userModel.findById(req.user._id).populate("Likes");
    if (user) {
      userLikes = user.Likes.map((like) => like._id.toString());
    }
  }

  const tripsWithFavourite = trips.map((trip) => {
    const isFavourite = userLikes.includes(trip._id.toString());
    const tripObject = trip.toObject();

    if (tripObject.category) {
      tripObject.category.name = tripObject.category[nameField];
      delete tripObject.category[nameField];
    }

    if (tripObject.typeOfPlace) {
      tripObject.typeOfPlace.name = tripObject.typeOfPlace[nameField];
      delete tripObject.typeOfPlace[nameField];
    }

    if (tripObject.activity) {
      const activityName = tripObject.activity[nameField] || "";
      const typeName = tripObject.activity.type
        ? tripObject.activity.type[nameField] || ""
        : "";

      tripObject.activity = {
        _id: tripObject.activity._id,
        name: `${typeName} ${activityName}`.trim(), // Combine type and activity names
      };
    } else {
      tripObject.activity = {
        _id: "",
        name: "", // Default to empty string if activity does not exist
      };
    }

    return {
      ...tripObject,
      isFavourite,
    };
  });

  const typesWithTranslatedNames = [];

  for (const type of types) {
    const typeObject = type.toObject();
    const baseTypeName = typeObject[nameField];

    const activities = await activityModel
      .find({ type: typeObject._id })
      .select(`${nameField} _id`);

    if (activities && activities.length > 0) {
      activities.forEach((activity) => {
        const activityName = activity[nameField];
        typesWithTranslatedNames.push({
          _id: typeObject._id,
          activityId: activity._id,
          name: `${baseTypeName} ${activityName}`.trim(),
        });
      });
    } else {
      typesWithTranslatedNames.push({
        _id: typeObject._id,
        name: baseTypeName,
      });
    }
  }

  res.status(200).json({
    success: true,
    types: typesWithTranslatedNames,
    banner: banner,
    offers: tripsWithFavourite,
  });
});

export const addRatingAndComment = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  const trip = await tripModel.findById(tripId);
  if (!trip) {
    return res.status(404).json({ success: false, message: "Trip not found" });
  }

  if (!Array.isArray(trip.ratings)) {
    trip.ratings = []; 
  }

  const newRating = await ratingModel.create({
    user: userId,
    rating,
    comment,
    trip: tripId,
  });

  trip.ratings.push(newRating._id);

  await trip.recalculateAverageRating();

  await trip.save();

  res.status(201).json({
    success: true,
    message: "Rating added successfully",
    data: newRating,
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
    .find({ leader: captin._id })
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

export const getScheduleUserTrips = asyncHandler(async (req, res, next) => {
  const language = req.query.lang || req.headers["accept-language"] || "en";
  const nameField = language === "ar" ? "name_ar" : "name_en";

  const userId = req.user._id;
  const { type, city } = req.query;
  const currentDate = new Date();

  let matchQuery = {};
  const typeIndex = parseInt(type, 10);

  const typeOptions = [
    {
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
      status: "current",
    },
    {
      startDate: { $gt: currentDate },
      status: "upComing",
    },
    {
      status: "completed",
    },
    {
      status: "pending",
    },
    {
      status: "cancelled",
    },
    {
      status: "rejected",
    },
  ];

  if (
    type !== undefined &&
    !isNaN(typeIndex) &&
    typeIndex >= 0 &&
    typeIndex < typeOptions.length
  ) {
    matchQuery = typeOptions[typeIndex];
  }

  if (city) {
    matchQuery.city = city;
  }

  const user = await userModel.findById(userId).populate({
    path: "Booked.tripId",
    match: matchQuery,
  });

  if (!user) {
    return next(new Error("User not found", { status: 404 }));
  }

  const tripIds = user.Booked.map((trip) => trip.tripId?._id).filter(Boolean);

  const trips = await tripModel.find({ _id: { $in: tripIds } }).populate([
    { path: "typeOfPlace", select: "name_ar name_en" },
    { path: "category", select: "name_ar name_en" },
    { path: "bedType", select: "name" },
    { path: "addition", select: "name" },
    {
      path: "tripLeaderId",
      select: "profileImage _id name tripsCounter averageRating",
    },
    { path: "cityId", select: "name" },
    { path: "activity", select: "name_ar name_en" },
  ]);

  const tripsWithDetails = await Promise.all(
    trips.map(async (trip) => {
      const bookedTrip = user.Booked.find((b) =>
        b.tripId?._id.equals(trip._id)
      );
      const bookedTickets = bookedTrip ? bookedTrip.BookedTicket : 0;

      const isFavourite = user.Likes.includes(trip._id);

      let commentsCount = 0;
      if (trip.status === "pending") {
        commentsCount = await ratingModel.countDocuments({ tripId: trip._id });
      }

      const categoryName = trip.category ? trip.category[nameField] : "";
      const typeOfPlaceName = trip.typeOfPlace
        ? trip.typeOfPlace[nameField]
        : "";
      const activityName = trip.activity ? trip.activity[nameField] : "";

      return {
        ...trip.toObject(),
        isFavourite,
        bookedTickets,
        category: {
          _id: trip.category?._id,
          name: categoryName,
        },
        typeOfPlace: {
          _id: trip.typeOfPlace?._id,
          name: typeOfPlaceName,
        },
        activity: {
          _id: trip.activity?._id || "",
          name: activityName,
        },
        ...(trip.status === "pending" && { commentsCount }),
      };
    })
  );

  res.status(200).json({
    success: true,
    trips: tripsWithDetails,
  });
});

export const cancel = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const userId = req.user._id;

  const trip = await tripModel.findById(tripId);

  if (!trip) {
    return res.status(404).json({ message: "Trip not found" });
  }

  // Check if the trip is pending and hasn't been booked yet
  if (trip.status === "pending") {
    trip.status = "cancelled";
    await trip.save();
    return res.status(200).json({
      success: true,
      message: "Trip cancelled",
    });
  }

  const user = await userModel.findById(userId);
  if (!user.Booked.includes(tripId)) {
    return res.status(403).json({
      message: "You have not booked this trip, so you cannot cancel it",
    });
  }

  trip.status = "cancelled";
  await trip.save();

  user.Booked = user.Booked.filter(
    (bookedTripId) => bookedTripId.toString() !== tripId.toString()
  );
  await user.save();

  res.status(200).json({
    success: true,
    message: "Trip has been cancelled successfully",
  });
});

export const tripsByBerth=asyncHandler(async(req,res,next)=>{
  const allBerthsWithTrips = await berthModel.find().lean();

  const berthsWithTrips = await Promise.all(
    allBerthsWithTrips.map(async (berth) => {
      const tripsForBerth = await tripModel
        .find({ berh: berth.name }) 
        .populate({
          path: 'typeOfPlace',
          select: 'name_en name_ar', 
        })
        .populate({
          path: 'activity',
          select: 'name_en name_ar', 
        })
        .select('_id startLocation typeOfPlace activity'); 

      return {
        berthName: berth.name,
        numberOfTrips: tripsForBerth.length,
        trips: tripsForBerth.map((trip) => ({
         _id: trip._id, 
          startLocation: trip.startLocation,
          typeOfPlace: trip.typeOfPlace
            ? req.headers['accept-language'] === 'ar'
              ? trip.typeOfPlace.name_ar
              : trip.typeOfPlace.name_en
            : null,
          activity: trip.activity
            ? req.headers['accept-language'] === 'ar'
              ? trip.activity.name_ar
              : trip.activity.name_en
            : null,
        })),
      };
    })
  );
  res.status(200).json({ allBerths: berthsWithTrips });
})

export const getUpcomingTripsByBerth = asyncHandler(async (req, res) => {
  const { berthName, index } = req.query;
  const acceptedLanguage = req.headers['accept-language'] === 'ar' ? 'ar' : 'en';

  if (!berthName) {
    return res.status(400).json({ success: false, message: "Berth name is required." });
  }

  const berth = await berthModel.findOne({ name: berthName });
  if (!berth) {
    return res.status(404).json({ success: false, message: "Berth not found." });
  }

  console.log('Berth Details:', berth); // Log berth details for debugging

  let query = {
    berh: berth.name,
    status: 'upComing',
  };

  if (index && index !== '0') {
    const indexMapping = {
      1: { typeOfPlace: '66dc1b0c37f54a0f875bf3c8', activity: '66dcc2b4626dfd336c9d8732' },
      2: { typeOfPlace: '66dc1b0c37f54a0f875bf3c8', activity: '66dcc2c6626dfd336c9d873a' },
      3: { typeOfPlace: '66dc1b1d37f54a0f875bf3cb', activity: '66e2c684b0272ceca8e3118e' },
      4: { typeOfPlace: '66dc1b1d37f54a0f875bf3cb', activity: '66e2c695b0272ceca8e31196' },
      5: { typeOfPlace: '66dc1b6737f54a0f875bf3ce' },
      6: { typeOfPlace: '66dc1ba737f54a0f875bf3d1' },
    };

    if (indexMapping[index]) {
      const { typeOfPlace, activity } = indexMapping[index];
      if (typeOfPlace) query.typeOfPlace = typeOfPlace;
      if (activity) query.activity = activity;
    }
  }

  const trips = await tripModel.find(query)
    .populate('typeOfPlace', `name_${acceptedLanguage}`)
    .populate('activity', `name_${acceptedLanguage}`)
    .select('_id typeOfPlace activity tripLeaderId startLocation');

  // Generate unique random locations for each trip
  const tripsWithRatings = await Promise.all(
    trips.map(async (trip, index) => {
      let tripLeaderRating = null;
      if (trip.tripLeaderId) {
        const tripLeader = await tripLeaderModel.findById(trip.tripLeaderId).select('ratings averageRating');
        tripLeaderRating = tripLeader ? tripLeader.averageRating : null;
      }

      let location;

      // Generate a unique random location for this specific trip
      // Ensure the offset or random distance is unique per trip
      const randomDistance = Math.random() * 0.01; // Small distance (e.g., up to 0.01 degrees)
      const randomAngle = Math.random() * 2 * Math.PI; // Random angle for direction

      const newLatitude = berth.location.Latitude + (randomDistance * Math.sin(randomAngle));
      const newLongitude = berth.location.Longitude + (randomDistance * Math.cos(randomAngle));

      location = {
        latitude: newLatitude,
        longitude: newLongitude,
      };
      return {
        _id: trip._id,
        typeOfPlace: trip.typeOfPlace ? trip.typeOfPlace[`name_${acceptedLanguage}`] : null,
        activity: trip.activity ? trip.activity[`name_${acceptedLanguage}`] : null,
        tripLeaderRating,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      };
    })
  );

  return res.status(200).json({ success: true, trips: tripsWithRatings });
});

/*
export const category = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const acceptedLanguage = req.headers['accept-language'] === 'ar' ? 'ar' : 'en';

  if (!categoryId) {
    return res.status(400).json({ success: false, message: "Category ID is required." });
  }

  const category = await categoryModel.findById(categoryId);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found." });
  }

  const typesOfPlaces = await typesOfPlacesModel.find({ categoryId })
    .populate('categoryId', `name_${acceptedLanguage}`)
    .lean();

  const mappedTypesOfPlaces = typesOfPlaces.map(place => ({
    _id: place._id,
    name: place[`name_${acceptedLanguage}`],
  }));

  const activities = await activityModel.find({ categoryId })
    .populate('type', `name_${acceptedLanguage}`)
    .lean();

  const mappedActivities = activities.map(activity => ({
    _id: activity._id,
    name: activity[`name_${acceptedLanguage}`],
    type: activity.type ? { id: activity.type._id, name: activity.type[`name_${acceptedLanguage}`] } : null,
  }));

  return res.status(200).json({
    success: true,
    category: {
      id: category._id,
      name: category[`name_${acceptedLanguage}`],
      typesOfPlaces: mappedTypesOfPlaces,
      activities: mappedActivities,
    },
  });
});
*/
export const getAllCategoriesWithTypesAndActivities = asyncHandler(async (req, res, next) => {
  const acceptedLanguage = req.headers['accept-language'] === 'ar' ? 'ar' : 'en';

  const categories = await categoryModel.find().lean();

  const result = await Promise.all(
    categories.map(async (category) => {
      const typesOfPlaces = await typesOfPlacesModel.find({ categoryId: category._id }).lean();

      const mappedTypes = await Promise.all(
        typesOfPlaces.map(async (type) => {
          const activities = await activityModel.find({ type: type._id }).lean();

          const mappedActivities = activities.map((activity) => ({
            _id: activity._id,
            name: activity[`name_${acceptedLanguage}`], 
          }));

          return {
            _id: type._id,
            name: type[`name_${acceptedLanguage}`], 
            isTool: type.isTool,
            activities: mappedActivities,
          };
        })
      );

      return {
        _id: category._id,
        name: category[`name_${acceptedLanguage}`], 
        typesOfPlaces: mappedTypes,
      };
    })
  );

  return res.status(200).json({
    success: true,
    categories: result,
  });
});

export const getLeaders=asyncHandler(async(req,res,next)=>{
  const ownerId = req.owner._id

  const leaders=await tripLeaderModel.find({ownerId}).select(' _id name')
  return res.status(200).json({success:true ,data: leaders})
})

export const getTools=asyncHandler(async(req,res,next)=>{
  const ownerId =req.owner._id
  const tools=await toolModel.find({createBy:ownerId}).select('_id name')

  return res.status(200).json({success:true ,data: tools})
})

export const getPlaces =asyncHandler(async(req,res,next)=>{
  const ownerId=req.owner._id
  const places= await placesModel.find({createBy:ownerId}).select('_id name')
  return res.status(200).json({success:true ,data: places})
})
