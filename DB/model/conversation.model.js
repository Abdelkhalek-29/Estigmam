import mongoose, { Schema, Types, model } from "mongoose";

const conversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        // ref: "User",
      },
    ],
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
    },
    isGroup: {
      type: Boolean,
      required: true,
      default: false, // Default for private chats
    },
    lastMessage: {
      text: String,
      senderId: {
        type: Schema.Types.ObjectId,
        // ref: "User"
      },
      seen: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

const conversationModel =
  mongoose.models.conversationModel ||
  model("Conversation", conversationSchema);
export default conversationModel;
