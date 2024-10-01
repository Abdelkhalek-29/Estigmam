import notificationModel from "../../../../DB/model/notification.model.js";
import tripModel from "../../../../DB/model/Trip.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import toolModel from "../../../../DB/model/tool.model.js";

export const createNotification = asyncHandler(async (req, res, next) => {
  const { description, receiver, tripId, toolId } = req.body;

  let notificationData = {
    description,
    receiver,
    sender: req.owner._id,
  };

  if (tripId) {
    const trip = await tripModel.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    notificationData = {
      ...notificationData,
      status: trip.status,
      tripId,
      title: trip.tripTitle,
    };
  } else if (toolId) {
    const tool = await toolModel.findById(toolId); 
    if (!tool) {
      return res.status(404).json({ message: "Tool not found" });
    }
    notificationData = {
      ...notificationData,
      toolId,
      title: tool.name, 
    };
  } else {
    return res.status(400).json({ message: "Either tripId or toolId must be provided" });
  }

  const notification = await notificationModel.create(notificationData);

  res.status(201).json({
    success: true,
    notification,
  });
});


export const getNotifications = asyncHandler(async (req, res, next) => {
  const { userId } = req.user._id;

  const notification = await notificationModel.find(userId);
  res.status(200).json({
    success: true,
    notification,
  });
});

export const deleteNotification = asyncHandler(async (req, res, next) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Invalid request. Provide an array of notification IDs." });
  }

  const result = await notificationModel.deleteMany({
    _id: { $in: ids },
  });


  res.status(200).json({ success: true, message: "Notifications deleted successfully." });
});

export const isRead = asyncHandler(async (req, res, next) => {
  const { ids } = req.body; 

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Invalid request. Provide an array of notification IDs." });
  }

  const notifications = await notificationModel.updateMany(
    { _id: { $in: ids } },
    { $set: { isRead: true } },
    { multi: true, new: true }
  );

  res.status(200).json({ success: true, message: "Notifications marked as read." });
});