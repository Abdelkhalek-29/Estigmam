import notificationModel from "../../../../DB/model/notification.model.js";
import tripModel from "../../../../DB/model/Trip.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import toolModel from "../../../../DB/model/tool.model.js";

export const createNotification = asyncHandler(async (req, res, next) => {
  const { description, receiver, tripId, toolId,placeId ,title} = req.body;
  let receiverModel = "User";  // Default to 'User', but adjust based on your logic (e.g., if the receiver can be an owner or trip leader)
  const notification = await notificationModel.create({
    description,
    receiver,
    tripId,
    toolId,
    placeId,
    title,
    receiverModel
  });

  res.status(201).json({
    success: true,
    notification,
  });
});


export const getNotifications = asyncHandler(async (req, res, next) => {
  const { _id: userId, role } = req.user || req.owner || req.tripLeader;

  const notifications = await notificationModel.find({
    receiver: userId, // The receiver of the notification
  });
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