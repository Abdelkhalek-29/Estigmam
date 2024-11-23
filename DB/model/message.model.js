import mongoose, { Schema, Types, model } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "GroupChat", // This field links to the group chat if it's a group message
    },
    senderId: {
      type: Schema.Types.ObjectId,
    },
    text: {
      type: String,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    // 	img: {
    //   id: String,
    //   url: String,
    // 	},
  },
  { timestamps: true }
);
const messageModel =
  mongoose.models.messageModel || model("Message", messageSchema);
export default messageModel;
