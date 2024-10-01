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
    lastMessage: {
        text: String,
        senderId: { type: Schema.Types.ObjectId, 
          // ref: "User" 
          },
        seen: {
          type: Boolean,
          default: false,
        },
      },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip", 
    },
  },
  { timestamps: true }
);

const GroupChat = mongoose.models.GroupChat || model("GroupChat", groupChatSchema);
export default GroupChat;
