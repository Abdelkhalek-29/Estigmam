import mongoose, { Schema, model } from "mongoose";

const groupChatSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    groupName: {
      type: String,
      required: true,
    },
    groupImage: {
      url: {
        type: String,
        default: null,
      },
      id: {
        type: String,
        default: null,
      },
    },
    lastMessage: {
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String },
      seen: { type: Boolean, default: false },
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
    },
  },
  { timestamps: true }
);

const GroupChat =
  mongoose.models.GroupChat || model("GroupChat", groupChatSchema);
export default GroupChat;
