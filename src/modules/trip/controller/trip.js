import categoryModel from "../../../../DB/model/category.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import cloudinary from "../../../utils/cloudinary.js";
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
import { createInvoice } from "../../../utils/invoiceService.js";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import {
  initiateApplePayPaymentService,
  initiateCardPaymentService,
  initiateGooglePayPaymentService,
  initiatePayPalPaymentService,
} from "../../../utils/payment.js";
import transactionModel from "../../../../DB/model/transactions.model.js";
import invoceModel from "../../../../DB/model/invoice.model.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createTrip = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    peopleNumber,
    startLocation,
    endLocation,
    berh,
    descriptionAddress,
    tripTitle,
    priceMember,
    addition = [],
    bedType = [],
    category,
    typeOfPlace,
    equipmentId,
    tripLeaderId,
    notes,
    offer,
    startLocationDetails, // Provided by the user
    endLocationDetails, // Provided by the user
  } = req.body;

  const tripCode = randomstring.generate({ length: 7, charset: "numeric" });
  const priceAfterOffer = Number.parseFloat(
    priceMember - (priceMember * (offer || 0)) / 100
  ).toFixed(2);

  const ownerId = req.owner?._id;
  const userId = req.user?._id;
  const tripLeader = req.tripLeader?._id;

  // Match startLocation with a berth
  let matchedStartBerth = await berthModel.findOne({
    "location.Latitude": startLocation?.Latitude,
    "location.Longitude": startLocation?.Longitude,
  });

  const resolvedStartLocationDetails = matchedStartBerth
    ? {
        details: matchedStartBerth.details,
        berthId: matchedStartBerth._id,
        name: matchedStartBerth.name,
        images: matchedStartBerth.images,
      }
    : startLocationDetails;

  // Match endLocation with a berth
  let matchedEndBerth = await berthModel.findOne({
    "location.Latitude": endLocation?.Latitude,
    "location.Longitude": endLocation?.Longitude,
  });

  const resolvedEndLocationDetails = matchedEndBerth
    ? {
        details: matchedEndBerth.details,
        berthId: matchedEndBerth._id,
        name: matchedEndBerth.name,
        images: matchedEndBerth.images,
      }
    : endLocationDetails;

  // Safely access the 'details' property
  const startLocationDetailsString =
    resolvedStartLocationDetails?.details || "N/A";
  const endLocationDetailsString = resolvedEndLocationDetails?.details || "N/A";

  let cityId = matchedStartBerth?.cityId || matchedEndBerth?.cityId || null;
  let cityName = null;
  if (cityId) {
    const city = await cityModel.findById(cityId);
    cityName = city?.name || null;
  }
  let distance = 0;
  if (
    startLocation?.Latitude &&
    startLocation?.Longitude &&
    endLocation?.Latitude &&
    endLocation?.Longitude
  )
    distance = haversineDistance(startLocation, endLocation);
  const city = await cityModel.findById(cityId).select("name");
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
    priceMember,
    addition,
    bedType,
    category,
    typeOfPlace,
    tripCode,
    numberOfPeopleAvailable: peopleNumber,
    cityId,
    city: city.name,
    offer,
    startLocationDetails: startLocationDetailsString,
    endLocationDetails: endLocationDetailsString,
    distance: parseFloat(distance.toFixed(2)),
  });

  // Handle equipment and images
  let defaultImage, subImages;
  let equipment =
    (await toolModel.findById(equipmentId)) ||
    (await placesModel.findById(equipmentId));

  if (equipment) {
    defaultImage = equipment.toolImage?.[0] || equipment.images?.[0];
    subImages = equipment.toolImage?.slice(1) || equipment.images?.slice(1);
  }
  if (ownerId) {
    Object.assign(newTrip, {
      createdBy: ownerId,
      tripLeaderId,
      equipmentId,
      defaultImage,
      subImages,
      status: "upComing",
    });
  } else if (userId) {
    Object.assign(newTrip, {
      notes,
      userId,
      isCustomized: true,
      status: "pending",
    });
  } else if (tripLeader) {
    const leader = await tripLeaderModel.findById(tripLeader);
    Object.assign(newTrip, {
      createdBy: leader.ownerId,
      tripLeaderId: leader._id,
      equipmentId,
      defaultImage,
      subImages,
      isLeaderCreate: true,
      status: "upComing",
    });
  }

  await newTrip.save();
  await GroupChat.create({
    tripId: newTrip._id,
    groupName: newTrip.tripTitle,
    participants: [tripLeaderId || userId || ownerId],
    lastMessage: {
      text: "Welcome to the trip!",
      senderId: tripLeaderId || userId || ownerId,
      seen: false,
    },
    groupImage: newTrip.defaultImage,
  });

  res.status(201).json({
    success: true,
    message: ownerId
      ? "Trip created successfully"
      : "Plan New Trip created successfully, waiting for approval",
    data: {
      id: newTrip._id,
      tripCode: newTrip.tripCode,
    },
  });
});

export const BookedTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { BookedTicket, paymentType } = req.body;
  const userId = req.user._id;

  // Validate trip
  const trip = await tripModel.findById(tripId);
  if (!trip) {
    return res.status(400).json({ success: false, message: "Trip not found" });
  }

  // Validate user
  const user = await userModel.findById(userId);
  if (!user) {
    return res.status(400).json({ success: false, message: "User not found" });
  }

  // Validate booked tickets
  if (!BookedTicket || isNaN(BookedTicket) || BookedTicket <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid number of tickets" });
  }

  // Validate trip price
  if (!trip.priceAfterOffer || isNaN(trip.priceAfterOffer)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid trip price" });
  }

  // Calculate total cost
  const totalCost = trip.priceAfterOffer * BookedTicket;

  // Handle wallet payment
  if (paymentType === "Wallet") {
    if (totalCost > user.wallet.balance) {
      return res.status(400).json({
        success: false,
        message: "Your balance is not enough to book this trip",
      });
    }

    // Deduct from user's wallet
    await userModel.findByIdAndUpdate(userId, {
      $inc: {
        "wallet.balance": -totalCost,
        "wallet.TotalWithdraw": totalCost,
      },
    });
  } else {
    // Handle other payment types (Card, PayPal, Apple Pay, Google Pay)
    let paymentResponse;
    switch (paymentType) {
      case "Card":
        paymentResponse = await initiateCardPaymentService({
          amount: totalCost,
        });
        break;
      case "PayPal":
        paymentResponse = await initiatePayPalPaymentService({
          amount: totalCost,
        });
        break;
      case "Apple":
        paymentResponse = await initiateApplePayPaymentService({
          amount: totalCost,
        });
        break;
      case "Google":
        paymentResponse = await initiateGooglePayPaymentService({
          amount: totalCost,
        });
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid payment type" });
    }

    // Validate payment response
    if (!paymentResponse?.result?.checkoutData?.postUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to initiate payment" });
    }

    // Create transaction record
    const orderId = randomstring.generate({ length: 7, charset: "numeric" });
    await transactionModel.create({
      actorId: userId,
      actorType: "User",
      amount: totalCost,
      type: "Trip",
      method: paymentType,
      status: "placed",
      numberOfTickets: BookedTicket,
      tripId: trip._id,
      reason: trip.tripTitle,
      orderId,
    });

    return res.status(200).json({
      success: true,
      message: "Redirect to payment",
      checkoutUrl: paymentResponse.result.checkoutData.postUrl,
      transactionCode: orderId,
    });
  }

  // Generate invoice
  const orderId = randomstring.generate({ length: 7, charset: "numeric" });
  const invoicePath = `/tmp/${orderId}.pdf`; // Use `/tmp` for AWS Lambda compatibility

  const invoiceData = {
    total: totalCost.toString(),
    bookingRef: orderId,
    tripDetails: trip.tripTitle,
    tripDuration: trip.tripDuration || "Not specified",
    numberOfPeople: BookedTicket.toString(),
    pricePerPerson: trip.priceAfterOffer.toString(),
    discount: trip.discount || "0",
    method: paymentType,
    invoiceNumber: orderId,
  };

  try {
    await createInvoice(invoiceData, invoicePath);
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate invoice" });
  }

  // Verify invoice file
  setTimeout(async () => {
    try {
      const stats = await fs.promises.stat(invoicePath);
      if (stats.size === 0) {
        return res
          .status(500)
          .json({ success: false, message: "Generated invoice is empty" });
      }
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Error checking invoice file" });
    }

    // Upload invoice to Cloudinary
    try {
      const cloudinaryResponse = await cloudinary.uploader.upload(invoicePath, {
        resource_type: "raw",
        folder: "invoices",
      });

      // Save invoice data to database
      const invoiceData = await invoceModel.create({
        invoiceNumber: orderId,
        userId,
        tripId: trip._id,
        tripTitle: trip.tripTitle,
        ticketPrice: trip.priceAfterOffer,
        amount: totalCost,
        invoicePath: cloudinaryResponse.secure_url,
      });

      // Delete local invoice file after successful upload
      if (cloudinaryResponse.secure_url) {
        await fs.promises.unlink(invoicePath);
      }

      // Create or update group chat for the trip
      let chatGroup = await GroupChat.findOne({ tripId });
      if (!chatGroup) {
        chatGroup = await GroupChat.create({
          tripId,
          groupName: `${trip.tripTitle} Chat`,
          participants: [userId],
          lastMessage: {
            text: "Welcome to the trip!",
            senderId: userId,
            seen: false,
          },
        });
      } else if (!chatGroup.participants.includes(userId.toString())) {
        chatGroup.participants.push(userId);
        await chatGroup.save();
      }

      // Return success response
      return res.status(200).json({
        success: true,
        message: "The trip has been booked successfully",
        transactionCode: orderId,
        tripId: trip._id,
        invoiceUrl: cloudinaryResponse.secure_url,
        invoiceId: invoiceData._id,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload invoice to Cloudinary",
      });
    }
  }, 1000); // Delay to ensure file is written before upload
});

export const handleWebhook = asyncHandler(async (req, res) => {
  try {
    console.log("Webhook payload received:", req.body);

    // Extract the signature from the headers
    const signature = req.headers["x-payment-signature"]; // Replace with the actual header key used by your payment gateway
    if (!signature) {
      console.error("Missing signature in headers");
      return res
        .status(400)
        .json({ success: false, message: "Missing signature" });
    }

    // Verify the webhook signature
    const payload = JSON.stringify(req.body);
    const computedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== computedSignature) {
      console.error("Invalid signature");
      return res
        .status(401)
        .json({ success: false, message: "Invalid signature" });
    }

    // Extract event data from the payload
    const { eventType, data } = req.body;
    if (!eventType || !data) {
      console.error("Invalid payload: Missing eventType or data");
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    console.log("Event type:", eventType);

    // Handle payment success event
    if (eventType === "payment_success") {
      const { transactionId, orderId, amount, status } = data;
      if (!transactionId || !orderId || !amount || !status) {
        console.error("Invalid payload: Missing required fields");
        return res
          .status(400)
          .json({ success: false, message: "Invalid payload" });
      }

      // Find the transaction in the database
      const transaction = await transactionModel.findOne({ orderId });
      if (!transaction) {
        console.error("Transaction not found for orderId:", orderId);
        return res
          .status(404)
          .json({ success: false, message: "Transaction not found" });
      }

      // Update the transaction status
      transaction.status = "completed";
      await transaction.save();
      console.log("Transaction updated:", transaction);

      // Find the user and trip associated with the transaction
      const user = await userModel.findById(transaction.actorId);
      const trip = await tripModel.findById(transaction.tripId);

      if (!user || !trip) {
        console.error("User or trip not found");
        return res
          .status(404)
          .json({ success: false, message: "User or trip not found" });
      }

      // Create or update group chat for the trip
      let chatGroup = await GroupChat.findOne({ tripId: trip._id });
      if (!chatGroup) {
        chatGroup = await GroupChat.create({
          tripId: trip._id,
          groupName: `${trip.tripTitle} Chat`,
          participants: [user._id],
          lastMessage: {
            text: "Welcome to the trip!",
            senderId: user._id,
            seen: false,
          },
        });
      } else if (!chatGroup.participants.includes(user._id.toString())) {
        chatGroup.participants.push(user._id);
        await chatGroup.save();
      }

      console.log("Group chat updated:", chatGroup);

      // Return success response
      return res
        .status(200)
        .json({ success: true, message: "Payment success processed" });
    }

    // Handle other event types (e.g., payment_failure, refund_initiated, etc.)
    console.log("Unhandled event type:", eventType);
    return res.status(200).json({ success: true, message: "Webhook received" });
  } catch (err) {
    console.error("Webhook error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

export const getInvoice = asyncHandler(async (req, res, next) => {
  const { invoiceId } = req.params;
  const invoice = await invoceModel.findById(invoiceId).select("invoicePath");
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: "Invoice not found",
    });
  }
  res.status(200).json({
    success: true,
    invoice,
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

  const user = req.user
    ? await userModel.findById(req.user._id).populate("Likes").populate("city")
    : null;

  const trip = await tripModel
    .findById(req.params.tripId)
    .populate({
      path: "tripLeaderId",
      select: "name profileImage tripsCounter averageRating",
      ref: "TripLeader",
    })
    .populate({
      path: "createdBy",
      select: "fullName profileImage tripsCounter averageRating",
      ref: "Owner",
    })
    .populate({
      path: "addition",
      select: `${nameField} Image`,
      ref: "Addition",
    })
    .populate({
      path: "bedType",
      select: `${nameField} image`,
      ref: "BedType",
    })
    .populate({
      path: "typeOfPlace",
      select: `${nameField}`,
      ref: "TypesOfPlaces",
    })
    .populate({
      path: "category",
      select: `${nameField}`,
      ref: "Category",
    });

  if (!trip) {
    return res.status(404).json({
      success: false,
      message: "Trip not found",
    });
  }

  const prepareTripResponse = (trip) => {
    const extractName = (obj) => (obj && obj[nameField] ? obj[nameField] : "");

    const tripResponse = {
      ...trip.toObject(),
      addition: trip.addition.map((add) => ({
        _id: add._id,
        name: extractName(add),
        image: add.Image,
      })),
      bedType: trip.bedType.map((bed) => ({
        _id: bed._id,
        name: extractName(bed),
        image: bed.image,
      })),
      category: {
        _id: trip.category._id,
        name: extractName(trip.category),
      },
      typeOfPlace: {
        _id: trip.typeOfPlace._id,
        name: extractName(trip.typeOfPlace),
      },
    };

    if (!tripResponse.tripLeaderId) {
      tripResponse.tripLeaderId = {
        _id: trip.createdBy._id,
        name: trip.createdBy.fullName,
        profileImage: trip.createdBy.profileImage,
        tripsCounter: trip.createdBy.tripsCounter,
        averageRating: trip.createdBy.averageRating,
      };
    }

    return tripResponse;
  };

  const tripData = prepareTripResponse(trip);

  let userLikes = [];
  if (user) {
    userLikes = user.Likes.map((like) => like._id.toString());
  }

  const isFavourite = userLikes.includes(tripData._id.toString());

  res.status(200).json({
    success: true,
    data: {
      ...tripData,
      isFavourite,
    },
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
      path: "createdBy",
      select: "fullName profileImage tripsCounter averageRating",
      ref: "Owner",
    })
    .populate({
      path: "addition",
      select: `${nameField}`,
      ref: "Addition",
    })
    .populate({
      path: "bedType",
      select: `${nameField}`,
      ref: "BedType",
    })
    .populate({
      path: "typeOfPlace",
      select: `${nameField}`,
      ref: "TypesOfPlaces",
    })
    .populate({
      path: "category",
      select: `${nameField}`,
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
  }

  let userLikes = [];
  if (user) {
    userLikes = user.Likes.map((like) => like._id.toString());
  }

  const tripsWithFavourite = trips.map((trip) => {
    const tripObject = trip.toObject();
    const isFavourite = userLikes.includes(tripObject._id.toString());

    const renameField = (obj, field) => {
      if (obj && obj[field]) {
        obj.name = obj[field];
        delete obj[nameField];
      }
    };

    if (tripObject.typeOfPlace) renameField(tripObject.typeOfPlace, nameField);
    if (tripObject.category) renameField(tripObject.category, nameField);
    if (tripObject.addition)
      tripObject.addition.forEach((add) => renameField(add, nameField));
    if (tripObject.bedType)
      tripObject.bedType.forEach((bed) => renameField(bed, nameField));

    if (!tripObject.tripLeaderId && tripObject.createdBy) {
      tripObject.tripLeaderId = {
        _id: tripObject.createdBy._id,
        name: tripObject.createdBy.fullName,
        profileImage: tripObject.createdBy.profileImage,
        tripsCounter: tripObject.createdBy.tripsCounter,
        averageRating: tripObject.createdBy.averageRating,
      };
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

  // Fetch types of places
  const types = await typesOfPlacesModel
    .find({ categoryId })
    .select(`${nameField} image`);

  if (!types || types.length === 0) {
    return next(new Error("Types not found", { status: 404 }));
  }

  // Fetch trips with populated fields
  const trips = await tripModel
    .find({ offer: { $gt: 0 }, category: categoryId })
    .populate("tripLeaderId", "name profileImage tripsCounter averageRating")
    .populate("addition", `${nameField} Image`)
    .populate("bedType", `${nameField} image`)
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
      options: { strictPopulate: false },
    });

  // Fetch banners
  const banner = await bannerModel.find({ categoryId });
  if (!banner || banner.length === 0) {
    return next(new Error("Banner not found!", { status: 404 }));
  }

  // Fetch user likes
  let userLikes = [];
  if (req.user) {
    const user = await userModel.findById(req.user._id).populate("Likes");
    if (user) {
      userLikes = user.Likes.map((like) => like._id.toString());
    }
  }

  // Process trips with favourites and renaming fields
  const tripsWithFavourite = trips.map((trip) => {
    const isFavourite = userLikes.includes(trip._id.toString());
    const tripObject = trip.toObject();

    // Rename category name field
    if (tripObject.category) {
      tripObject.category.name = tripObject.category[nameField];
      delete tripObject.category[nameField];
    }

    // Rename typeOfPlace name field
    if (tripObject.typeOfPlace) {
      tripObject.typeOfPlace.name = tripObject.typeOfPlace[nameField];
      delete tripObject.typeOfPlace[nameField];
    }

    // Rename addition and bedType fields
    if (tripObject.addition && Array.isArray(tripObject.addition)) {
      tripObject.addition = tripObject.addition.map((add) => ({
        _id: add._id,
        name: add[nameField],
        image: add.Image,
      }));
    }

    if (tripObject.bedType && Array.isArray(tripObject.bedType)) {
      tripObject.bedType = tripObject.bedType.map((bed) => ({
        _id: bed._id,
        name: bed[nameField],
        image: bed.image,
      }));
    }

    // Process activity name field
    if (tripObject.activity) {
      const activityName = tripObject.activity[nameField] || "";
      const typeName = tripObject.activity.type
        ? tripObject.activity.type[nameField] || ""
        : "";

      tripObject.activity = {
        _id: tripObject.activity._id,
        name: `${typeName} ${activityName}`.trim(),
      };
    } else {
      tripObject.activity = {
        _id: "",
        name: "",
      };
    }

    return {
      ...tripObject,
      isFavourite,
    };
  });

  // Process types and activities with translated names
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
  const tripLeader = await tripLeaderModel
    .findById(trip.tripLeaderId)
    .select("name profileImage averageRating tripsCounter");

  let captin;
  if (tripLeader) {
    captin = tripLeader;
  } else {
    const owner = await OwnerModel.findById(trip.createdBy).select(
      "fullName profileImage averageRating tripsCounter"
    );

    if (owner) {
      captin = {
        _id: owner._id,
        name: owner.fullName,
        profileImage: owner.profileImage,
        averageRating: owner.averageRating,
        tripsCounter: owner.tripsCounter,
      };
    }
  }

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
      userId,
      isCustomized: true,
    },
    {
      status: "cancelled",
      userId,
      isCustomized: true,
    },
    {
      status: "rejected",
      userId,
      isCustomized: true,
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

  let trips = [];

  if (matchQuery.status === "cancelled" || matchQuery.status === "pending") {
    // Directly fetch cancelled and pending trips
    trips = await tripModel
      .find(matchQuery)
      .populate([
        { path: "typeOfPlace", select: "name_ar name_en" },
        { path: "category", select: "name_ar name_en" },
        { path: "bedType", select: "name_ar name_en image" },
        { path: "addition", select: "name_ar name_en Image" },
        {
          path: "tripLeaderId",
          select: "profileImage _id name tripsCounter averageRating",
        },
        { path: "cityId", select: "name" },
        { path: "activity", select: "name_ar name_en" },
      ])
      .lean();

    // Format the response properly
    trips = trips.map((trip) => ({
      ...trip,
      category: trip.category
        ? { _id: trip.category._id, name: trip.category[nameField] }
        : null,
      typeOfPlace: trip.typeOfPlace
        ? { _id: trip.typeOfPlace._id, name: trip.typeOfPlace[nameField] }
        : null,
      activity: trip.activity
        ? { _id: trip.activity._id, name: trip.activity[nameField] }
        : null,
      addition:
        trip.addition?.map((addition) => ({
          _id: addition._id,
          name: addition[nameField] || "",
          image: addition.Image || "",
        })) || [],
      bedType:
        trip.bedType?.map((bedType) => ({
          _id: bedType._id,
          name: bedType[nameField] || "",
          image: bedType.image || "",
        })) || [],
    }));
  } else {
    const user = await userModel
      .findById(userId)
      .populate({
        path: "Booked.tripId",
        match: matchQuery,
      })
      .lean();

    if (!user) {
      return next(new Error("User not found", { status: 404 }));
    }

    const tripIds = user.Booked.map((trip) => trip.tripId?._id).filter(Boolean);

    trips = await tripModel
      .find({ _id: { $in: tripIds } })
      .populate([
        { path: "typeOfPlace", select: "name_ar name_en" },
        { path: "category", select: "name_ar name_en" },
        { path: "bedType", select: "name_ar name_en image" },
        { path: "addition", select: "name_ar name_en Image" },
        {
          path: "tripLeaderId",
          select: "profileImage _id name tripsCounter averageRating",
        },
        { path: "cityId", select: "name" },
        { path: "activity", select: "name_ar name_en" },
      ])
      .lean();

    trips = await Promise.all(
      trips.map(async (trip) => {
        const bookedTrip = user.Booked.find((b) =>
          b.tripId?._id.equals(trip._id)
        );
        const bookedTickets = bookedTrip ? bookedTrip.BookedTicket : 0;

        const isFavourite = user.Likes.includes(trip._id);

        let commentsCount = 0;
        if (trip.status === "pending") {
          commentsCount = await ratingModel.countDocuments({
            tripId: trip._id,
          });
        }

        return {
          ...trip,
          isFavourite,
          bookedTickets,
          category: trip.category
            ? { _id: trip.category._id, name: trip.category[nameField] }
            : null,
          typeOfPlace: trip.typeOfPlace
            ? { _id: trip.typeOfPlace._id, name: trip.typeOfPlace[nameField] }
            : null,
          activity: trip.activity
            ? { _id: trip.activity._id, name: trip.activity[nameField] }
            : null,
          bedType:
            trip.bedType?.map((bedType) => ({
              _id: bedType._id,
              name: bedType[nameField] || "",
              image: bedType.image || "",
            })) || [],
          addition:
            trip.addition?.map((addition) => ({
              _id: addition._id,
              name: addition[nameField] || "",
              image: addition.Image || "",
            })) || [],
          ...(trip.status === "pending" && { commentsCount }),
        };
      })
    );
  }

  res.status(200).json({
    success: true,
    trips,
  });
});

export const cancel = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const userId = req.user._id;

  const trip = await tripModel.findById(tripId);

  if (!trip) {
    return res.status(404).json({ message: "Trip not found" });
  }
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

export const tripsByBerth = asyncHandler(async (req, res, next) => {
  const allBerthsWithTrips = await berthModel.find().lean();

  const berthsWithTrips = await Promise.all(
    allBerthsWithTrips.map(async (berth) => {
      const tripsForBerth = await tripModel
        .find({ berh: berth.name })
        .populate({
          path: "typeOfPlace",
          select: "name_en name_ar",
        })
        .populate({
          path: "activity",
          select: "name_en name_ar",
        })
        .select("_id startLocation typeOfPlace activity");

      return {
        berthName: berth.name,
        numberOfTrips: tripsForBerth.length,
        trips: tripsForBerth.map((trip) => ({
          _id: trip._id,
          startLocation: trip.startLocation,
          typeOfPlace: trip.typeOfPlace
            ? req.headers["accept-language"] === "ar"
              ? trip.typeOfPlace.name_ar
              : trip.typeOfPlace.name_en
            : null,
          activity: trip.activity
            ? req.headers["accept-language"] === "ar"
              ? trip.activity.name_ar
              : trip.activity.name_en
            : null,
        })),
      };
    })
  );
  res.status(200).json({ allBerths: berthsWithTrips });
});

export const getUpcomingTripsByBerth = asyncHandler(async (req, res) => {
  const { berthName, index } = req.query;
  const acceptedLanguage =
    req.headers["accept-language"] === "ar" ? "ar" : "en";

  if (!berthName) {
    return res
      .status(400)
      .json({ success: false, message: "Berth name is required." });
  }

  const berth = await berthModel.findOne({ name: berthName });
  if (!berth) {
    return res
      .status(404)
      .json({ success: false, message: "Berth not found." });
  }

  console.log("Berth Details:", berth); // Log berth details for debugging

  let query = {
    berh: berth.name,
    status: "upComing",
  };

  if (index && index !== "0") {
    const indexMapping = {
      1: {
        typeOfPlace: "66dc1b0c37f54a0f875bf3c8",
        activity: "66dcc2b4626dfd336c9d8732",
      },
      2: {
        typeOfPlace: "66dc1b0c37f54a0f875bf3c8",
        activity: "66dcc2c6626dfd336c9d873a",
      },
      3: {
        typeOfPlace: "66dc1b1d37f54a0f875bf3cb",
        activity: "66e2c684b0272ceca8e3118e",
      },
      4: {
        typeOfPlace: "66dc1b1d37f54a0f875bf3cb",
        activity: "66e2c695b0272ceca8e31196",
      },
      5: { typeOfPlace: "66dc1b6737f54a0f875bf3ce" },
      6: { typeOfPlace: "66dc1ba737f54a0f875bf3d1" },
    };

    if (indexMapping[index]) {
      const { typeOfPlace, activity } = indexMapping[index];
      if (typeOfPlace) query.typeOfPlace = typeOfPlace;
      if (activity) query.activity = activity;
    }
  }

  const trips = await tripModel
    .find(query)
    .populate("typeOfPlace", `name_${acceptedLanguage}`)
    .populate("activity", `name_${acceptedLanguage}`)
    .select("_id typeOfPlace activity tripLeaderId startLocation");

  // Generate unique random locations for each trip
  const tripsWithRatings = await Promise.all(
    trips.map(async (trip, index) => {
      let tripLeaderRating = null;
      if (trip.tripLeaderId) {
        const tripLeader = await tripLeaderModel
          .findById(trip.tripLeaderId)
          .select("ratings averageRating");
        tripLeaderRating = tripLeader ? tripLeader.averageRating : null;
      }

      let location;

      // Generate a unique random location for this specific trip
      // Ensure the offset or random distance is unique per trip
      const randomDistance = Math.random() * 0.01; // Small distance (e.g., up to 0.01 degrees)
      const randomAngle = Math.random() * 2 * Math.PI; // Random angle for direction

      const newLatitude =
        berth.location.Latitude + randomDistance * Math.sin(randomAngle);
      const newLongitude =
        berth.location.Longitude + randomDistance * Math.cos(randomAngle);

      location = {
        latitude: newLatitude,
        longitude: newLongitude,
      };
      return {
        _id: trip._id,
        typeOfPlace: trip.typeOfPlace
          ? trip.typeOfPlace[`name_${acceptedLanguage}`]
          : null,
        activity: trip.activity
          ? trip.activity[`name_${acceptedLanguage}`]
          : null,
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
export const getAllCategoriesWithTypesAndActivities = asyncHandler(
  async (req, res, next) => {
    const acceptedLanguage =
      req.headers["accept-language"] === "ar" ? "ar" : "en";

    const categories = await categoryModel.find().lean();

    const result = await Promise.all(
      categories.map(async (category) => {
        const typesOfPlaces = await typesOfPlacesModel
          .find({ categoryId: category._id })
          .lean();

        const mappedTypes = await Promise.all(
          typesOfPlaces.map(async (type) => {
            const activities = await activityModel
              .find({ type: type._id })
              .lean();

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
  }
);

export const getLeaders = asyncHandler(async (req, res, next) => {
  const ownerId = req.owner._id;
  const { type } = req.params;

  const tool = await toolModel.findOne({ type });
  const place = await placesModel.findOne({ type });

  let leaders = [];

  if (tool) {
    leaders = await tripLeaderModel
      .find({ ownerId, typeId: tool.type })
      .select("_id name");
  } else if (place) {
    leaders = await tripLeaderModel
      .find({ ownerId, typeId: place.type })
      .select("_id name");
  }
  const owner = await OwnerModel.findById(ownerId).select("_id fullName");
  const ownerObject = {
    _id: owner._id,
    name: owner.fullName,
  };
  leaders.unshift(ownerObject);
  return res.status(200).json({ success: true, data: leaders });
});

export const getTools = asyncHandler(async (req, res, next) => {
  const ownerId = req.owner?._id || req.tripLeader?._id;

  let tools;
  if (req.owner) {
    tools = await toolModel
      .find({ createBy: ownerId, isUpdated: true })
      .select("_id name type");
  } else if (req.tripLeader) {
    tools = await toolModel
      .find({
        createBy: req.tripLeader.ownerId,
        type: req.tripLeader.typeId,
        isUpdated: true,
      })
      .select("_id name type");
  }

  return res.status(200).json({ success: true, data: tools });
});

export const getPlaces = asyncHandler(async (req, res, next) => {
  const ownerId = req.owner?._id || req.tripLeader?._id;

  let places;
  if (req.owner) {
    places = await placesModel
      .find({ createBy: ownerId, isUpdated: true })
      .select("_id name type");
  } else if (req.tripLeader) {
    places = await placesModel
      .find({ type: req.tripLeader.typeId, isUpdated: true })
      .select("_id name type");
  }

  return res.status(200).json({ success: true, data: places });
});
