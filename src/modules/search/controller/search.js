import searchHistoryModel from "../../../../DB/model/search.model.js";
import typesOfPlacesModel from "../../../../DB/model/typesOfPlaces.model.js";
import placesModel from "../../../../DB/model/places.model.js";
import toolModel from "../../../../DB/model/tool.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import mongoose from "mongoose";
import tripModel from "../../../../DB/model/Trip.model.js";
import berthModel from "../../../../DB/model/berth.model.js";
import searchHistoryBrthModel from "../../../../DB/model/searchHistory.model.js";

export const search = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  const language = req.query.lang || req.headers["accept-language"] || "en";
  const nameField = language === "ar" ? "name_ar" : "name_en";

  if (!query) {
    return next(new Error("Query parameter is required", { cause: 400 }));
  }

  let searchCriteria = {
    $or: [
      { tripTitle: new RegExp(query, "i") },
      { berh: new RegExp(query, "i") },
    ],
  };
  const trips = await tripModel
    .find(searchCriteria)
    .populate("cityId", "name")
    .populate({
      path: "typeOfPlace",
      select: "name_ar name_en", 
      ref: "TypesOfPlaces",
    })
    .select("tripTitle berh startDate endDate typeOfPlace");

  const transformedTrips = trips.map(trip => {
    const typeOfPlace = trip.typeOfPlace ? {
      _id: trip.typeOfPlace._id,
      name: trip.typeOfPlace[nameField], 
    } : {};

    return {
      ...trip.toObject(), 
      typeOfPlace, 
    };
  });

  res.status(200).json({
    success: true,
    data: transformedTrips,
  });
});

export const saveSearchResult = asyncHandler(async (req, res, next) => {
  const { searchId } = req.params;
  const userId = req.user._id;

  const selectedTrip = await tripModel.findById(searchId);

  if (!selectedTrip) {
    return next(new Error("Trip not found", { cause: 404 }));
  }

  const newSearchHistory = await searchHistoryModel.create({
    userId,
    tripId: selectedTrip._id,
    tripTitle: selectedTrip.tripTitle,
    berh: selectedTrip.berh,
  });

  res.status(201).json({
    success: true,
    message: "Search result saved successfully",
  });
});

export const getRecentSearches = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const recentSearches = await searchHistoryModel
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("tripId tripTitle berh");
  res.status(200).json({
    success: true,
    message: "Recent searches retrieved successfully.",
    data: recentSearches,
  });
});

// Map user
export const searchBerth = asyncHandler(async (req, res) => {
  const { name } = req.query;

  const berths = await berthModel.find({
    name: { $regex: name, $options: "i" }
  }).select("_id name location name");

  return res.status(200).json({sucess :true, berths});
});

export const saveSearchResultBerth = asyncHandler(async (req, res) => {
  const { berthId } = req.params;

  // Determine if the request is coming from a user, owner, or trip leader
  const userId = req.user?._id || req.owner?._id || req.tripLeader?._id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const berth = await berthModel.findById(berthId);
  if (!berth) {
    return res.status(404).json({ message: "Berth not found" });
  }

  const newSearch = new searchHistoryBrthModel({
    berthName: berth.name,
    berthId: berth._id,
    location: berth.location,
    userId,  // This now includes user, owner, or trip leader
  });

  await newSearch.save();

  return res.status(201).json({ message: "Search result saved successfully" });
});



export const getSearchHistory = asyncHandler(async (req, res) => {
  // Determine if the request is coming from a user, owner, or trip leader
  const userId = req.user?._id || req.owner?._id || req.tripLeader?._id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const searchHistory = await searchHistoryBrthModel
    .find({ userId })
    .sort({ createdAt: -1 }) 
    .limit(4)
    .select("berthName location");

  const formattedSearchHistory = searchHistory.map((history) => ({
    _id: history._id,
    name: history.berthName, 
    location: history.location,
  }));

  return res.status(200).json({ success: true, berths: formattedSearchHistory });
});
