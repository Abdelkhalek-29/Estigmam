import notificationModel from "../../../../DB/model/notification.model.js";
import tripModel from "../../../../DB/model/Trip.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import toolModel from "../../../../DB/model/tool.model.js";

export const createNotification = asyncHandler(async (req, res, next) => {
  const { description, receiver, tripId, toolId } = req.body;

  // Determine the sender from the authenticated user (owner, trip leader, or user)
  let sender = req.owner ? req.owner._id : req.tripLeader ? req.tripLeader._id : req.user._id;
  let senderModel = req.owner ? "Owner" : req.tripLeader ? "TripLeader" : "User";

  // Ensure receiverModel is set to match the receiver's role
  let receiverModel = "User";  // Default to 'User', but adjust based on your logic (e.g., if the receiver can be an owner or trip leader)

  let notificationData = {
    description,
    receiver,
    sender,
    senderModel,
    receiverModel, // Include the model of the receiver (adjust based on your logic)
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
  // Depending on the role (user, owner, trip leader), the authenticated entity will be set in the request object by the auth middleware
  const { _id: userId, role } = req.user || req.owner || req.tripLeader;

  // Fetch notifications based on the user's role and ID
  const notifications = await notificationModel.find({
    receiver: userId, // The receiver of the notification
  });

  // Return the fetched notifications
  res.status(200).json({
    success: true,
    notifications,
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