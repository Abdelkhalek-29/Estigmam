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
    status: {
      type: String,
    },
    sender: {
      type:Types.ObjectId,
      ref:"User"
    },
    receiver:{
      type:Types.ObjectId,
      ref:"User"
    },
    tripId: {
      type: Types.ObjectId,
      ref: "Trip",
    },
    toolId:{
      type: Types.ObjectId,
      ref:"Tool",
    },
   /* approve: {
      type: Boolean,
      default: false,
    },
    ownerId: {
      type: Types.ObjectId,
      ref: "Owner",
    },*/
    isRead:{type:Boolean,default:false}
  },

  { timestamps: true }
);
const notificationModel =
  mongoose.models.notificationModel ||
  model("Notification", notificationSchema);
export default notificationModel;
