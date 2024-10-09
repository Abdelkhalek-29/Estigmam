import mongoose, { Schema, Types, model } from "mongoose";

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    receiver: {
      type: Types.ObjectId,
      refPath: 'receiverModel',
      required: true,
    },
    receiverModel: {
      type: String,
      required: true,
      enum: ['User', 'Owner', 'TripLeader'], 
    },
    tripId: {
      type: Types.ObjectId,
      ref: "Trip",
    },
    toolId: {
      type: Types.ObjectId,
      ref: "Tool",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    placeId: {
      type: Types.ObjectId,
      ref: "Place",
    },
  },
  { timestamps: true }
);
const notificationModel =
  mongoose.models.notificationModel ||
  model("Notification", notificationSchema);
export default notificationModel;
