import activityModel from "../../../../DB/model/activity.model.js";
import categoryModel from "../../../../DB/model/category.model.js";
import typesOfPlacesModel from "../../../../DB/model/typesOfPlaces.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const addActivity = asyncHandler(async (req, res, next) => {
  const { name_ar, name_en, type, categoryId } = req.body;

  let typeOfPlacesAndTools = await typesOfPlacesModel.findById(type);
  if (!typeOfPlacesAndTools) {
    return next(new Error("Type not found", { cause: 404 }));
  }

  const category = await categoryModel.findById(categoryId);
  if (!category) {
    return next(new Error("Category not found", { cause: 404 }));
  }

  const newActivity = await activityModel.create({
    name_ar,
    name_en,
    type,
    createBy: req.owner._id,
    categoryId: category._id,
  });

  /*const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.FOLDER_CLOUDINARY}/activity/${newActivity._id}`,
    }
  );
  newActivity.image = { url: secure_url, id: public_id };

  await newActivity.save();*/
  res.status(201).json({
    success: true,
    message: "Activity created successfully",
    activity: newActivity,
  });
});

export const deleteActivity = asyncHandler(async (req, res, next) => {
  const { activityId } = req.params;
  const ownerId = req.owner._id;

  const activity = await activityModel.findById(activityId);

  if (!activity) {
    return next(new Error("Activity not found", { cause: 404 }));
  }
  if (activity.createBy.toString() !== ownerId.toString()) {
    return next(
      new Error("You are not authorized to delete this activity", {
        cause: 403,
      })
    );
  }
  await activityModel.findByIdAndDelete(activityId);

  res.status(200).json({ message: "Activity deleted successfully" });
});

export const updateActivity = asyncHandler(async (req, res, next) => {
  const { activityId } = req.params;
  const ownerId = req.owner._id;

  const { name, type } = req.body;

  if (!ownerId) {
    return next(
      new Error("Owner ID is not set in the request", { cause: 400 })
    );
  }

  const activity = await activityModel.findById(activityId);

  if (!activity) {
    return next(new Error("Activity not found", { cause: 404 }));
  }

  if (activity.createBy.toString() !== ownerId.toString()) {
    return next(
      new Error("You are not authorized to update this activity", {
        cause: 403,
      })
    );
  }

  if (name) activity.name = name;
  if (type) activity.type = type;

  await activity.save();

  res.status(200).json({
    succeess: true,
    message: "Activity updated successfully",
    activity,
  });
});

export const getActivities = asyncHandler(async (req, res, next) => {
  const { typeId } = req.params;

  const activities = await activityModel
    .find({ type: typeId })
    .select("_id name_ar type createBy createdAt updatedAt")
    .populate({
      path: "type",
      ref: "TypesOfPlaces",
      select: "name_ar -_id",
    });

  const formattedActivities = activities.map((activity) => ({
    _id: activity._id,
    name: activity.name_ar,
    type: {
      name: activity.type?.name_ar || null,
    },
    createBy: activity.createBy,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
    __v: activity.__v,
  }));

  res.status(200).json({ activities: formattedActivities });
});
