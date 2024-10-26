// import { getRecipientSocketId, io } from "../../../../index.js";
import conversationModel from "../../../../DB/model/conversation.model.js";
import GroupChat from "../../../../DB/model/groupChat,model.js";
import messageModel from "../../../../DB/model/message.model.js";
import OwnerModel from "../../../../DB/model/Owner.model .js";
import tripLeaderModel from "../../../../DB/model/tripLeader.model.js";
import userModel from "../../../../DB/model/User.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
// import cloudinary from "../../../utils/cloud.js";
import admin from "../../../utils/firebase.js";
export const sendMessage = asyncHandler(async (req, res, next) => {
  const { recipientId, message } = req.body;

  if (!recipientId || !message) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Recipient ID and message are required",
      });
  }

  let recipient;
  let isGroup = false;

  if (recipientId.match(/^[0-9a-fA-F]{24}$/)) {
    recipient = await GroupChat.findById(recipientId);
    if (recipient) {
      isGroup = true;
    }
  }

  if (!recipient || (recipient && isGroup === false)) {
    recipient =
      (await userModel.findById(recipientId)) ||
      (await OwnerModel.findById(recipientId)) ||
      (await tripLeaderModel.findById(recipientId));

    if (!recipient) {
      return res
        .status(404)
        .json({ success: false, message: "Recipient not found" });
    }
  }

  const senderId = req.user
    ? req.user._id
    : req.owner
    ? req.owner._id
    : req.tripLeader._id;

  let conversation;

  if (isGroup) {
    conversation = await GroupChat.findById(recipientId);
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Group conversation not found" });
    }
    conversation.lastMessage = { senderId, text: message, seen: false };
    await conversation.save();
  } else {
    conversation = await conversationModel.findOne({
      participants: { $all: [senderId, recipientId] },
      isGroup: false,
    });

    if (!conversation) {
      conversation = await conversationModel.create({
        participants: [senderId, recipientId],
        lastMessage: {
          senderId,
          text: message,
          seen: false,
        },
      });
    } else {
      conversation.lastMessage = { senderId, text: message, seen: false };
      await conversation.save();
    }
  }

  const newMessage = await messageModel.create({
    conversationId: conversation._id,
    senderId,
    text: message,
  });

  const recipientUser = await userModel
    .findById(recipientId)
    .select("fcmToken");
  if (recipientUser && recipientUser.fcmToken) {
    const messagePayload = {
      notification: {
        title: `New message from ${req.user.userName}`,
        body: message,
      },
      data: {
        type: 'chat', 
        conversationId: conversation._id, 
        senderId: senderId.toString(), 
      },
      token: recipientUser.fcmToken,
    };

    admin
      .messaging()
      .send(messagePayload)
      .then((response) => {
        console.log("Successfully sent push notification:", response);
      })
      .catch((error) => {
        console.error("Error sending push notification:", error);
      });
  }

  return res.status(201).json({
    success: true,
    data: newMessage,
  });
});

export const getMessages = asyncHandler(async (req, res, next) => {
  const { conversationId, otherUserId } = req.params;
  const userId = req.user
    ? req.user._id
    : req.owner
    ? req.owner._id
    : req.tripLeader._id;

  if (!conversationId && !otherUserId) {
    return res.status(400).json({
      success: false,
      message: "Conversation ID or User ID is required",
    });
  }

  let conversation;

  if (conversationId) {
    conversation = await conversationModel.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (conversation.isGroup && !conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "User is not a participant of this group chat",
      });
    }
  } else if (otherUserId) {
    conversation = await conversationModel.findOne({
      participants: { $all: [userId, otherUserId] },
      isGroup: false,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Private conversation not found" });
    }
  }

  const messages = await messageModel
    .find({ conversationId: conversation._id })
    .sort({ createdAt: 1 });

  let userDetails;

  if (conversation.isGroup) {
    userDetails = await getParticipantsDetails(conversation.participants);
  } else {
    userDetails = await getUserDetails(otherUserId);
  }

  return res.status(200).json({
    success: true,
    conversation: {
      _id: conversation._id,
      participants: userDetails, 
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      lastMessage: conversation.lastMessage
        ? {
            senderId: conversation.lastMessage.senderId,
            text: conversation.lastMessage.text,
            seen: conversation.lastMessage.seen,
          }
        : null,
    },
    messages: messages.map((message) => ({
      _id: message._id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      text: message.text,
      seen: message.seen,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    })),
  });
});
const getParticipantsDetails = async (participantIds) => {
  const userDetails = await userModel
    .find({ _id: { $in: participantIds } })
    .select("userName profileImage");
  const ownerDetails = await OwnerModel.find({
    _id: { $in: participantIds },
  }).select("userName profileImage");
  const tripLeaderDetails = await tripLeaderModel
    .find({ _id: { $in: participantIds } })
    .select("userName profileImage");

  return [...userDetails, ...ownerDetails, ...tripLeaderDetails];
};

const getUserDetails = async (otherUserId) => {
  let userDetails = await userModel
    .findById(otherUserId)
    .select("userName profileImage");
  if (!userDetails) {
    userDetails = await OwnerModel.findById(otherUserId).select(
      "userName profileImage"
    );
  }
  if (!userDetails) {
    userDetails = await tripLeaderModel
      .findById(otherUserId)
      .select("userName profileImage");
  }
  return userDetails;
};
export const getConversations = asyncHandler(async (req, res, next) => {
  const userId = req.user
    ? req.user._id
    : req.owner
    ? req.owner._id
    : req.tripLeader._id;

  const privateConversations = await conversationModel.aggregate([
    { $match: { participants: userId } },

    {
      $lookup: {
        from: "users",
        localField: "participants",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $lookup: {
        from: "owners",
        localField: "participants",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $lookup: {
        from: "tripLeaders",
        localField: "participants",
        foreignField: "_id",
        as: "tripLeaderDetails",
      },
    },
    {
      $addFields: {
        allParticipantDetails: {
          $concatArrays: [
            "$userDetails",
            "$ownerDetails",
            "$tripLeaderDetails",
          ],
        },
      },
    },
    {
      $addFields: {
        participants: {
          $filter: {
            input: "$allParticipantDetails",
            as: "participant",
            cond: {
              $ne: ["$$participant._id", userId],
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: "messages",
        let: { conversationId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$conversationId", "$$conversationId"] }],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "lastMessageDetails",
      },
    },
    {
      $addFields: {
        lastMessage: { $arrayElemAt: ["$lastMessageDetails", 0] },
      },
    },
    {
      $project: {
        lastMessage: {
          seen: 1,
          text: 1,
          senderId: 1,
        },
        _id: 1,
        participants: {
          _id: 1,
          userName: 1,
          profileImage: 1,
        },
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  const groupConversations = await GroupChat.aggregate([
    { $match: { participants: userId } },

    {
      $lookup: {
        from: "users",
        localField: "participants",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $lookup: {
        from: "owners",
        localField: "participants",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $lookup: {
        from: "tripLeaders",
        localField: "participants",
        foreignField: "_id",
        as: "tripLeaderDetails",
      },
    },
    {
      $addFields: {
        allParticipantDetails: {
          $concatArrays: [
            "$userDetails",
            "$ownerDetails",
            "$tripLeaderDetails",
          ],
        },
      },
    },
    {
      $addFields: {
        participants: {
          $filter: {
            input: "$allParticipantDetails",
            as: "participant",
            cond: {
              $ne: ["$$participant._id", userId],
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: "messages",
        let: { conversationId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$conversationId", "$$conversationId"] }],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "lastMessageDetails",
      },
    },
    {
      $addFields: {
        lastMessage: { $arrayElemAt: ["$lastMessageDetails", 0] },
      },
    },
    {
      $project: {
        lastMessage: {
          seen: 1,
          text: 1,
          senderId: 1,
        },
        _id: 1,
        participants: {
          _id: 1,
          userName: 1,
          profileImage: 1,
        },
        groupName: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  const conversations = [...privateConversations, ...groupConversations];

  return res.status(200).json({ success: true, conversations });
});

export const deleteConversation = asyncHandler(async (req, res, next) => {
  const { conversationId } = req.params;
  const userId = req.user
    ? req.user._id
    : req.owner
    ? req.owner._id
    : req.tripLeader._id;

  let conversation = await conversationModel.findById(conversationId);
  let isGroupChat = false;

  if (!conversation) {
    conversation = await GroupChat.findById(conversationId);
    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }
    isGroupChat = true;
  }

  if (!isGroupChat) {
    if (!conversation.participants.includes(userId)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized to delete this conversation",
        });
    }

    await messageModel.deleteMany({ conversationId: conversation._id });
    await conversation.remove();

    return res
      .status(200)
      .json({ success: true, message: "Private conversation deleted" });
  }

  if (isGroupChat) {
    const isAdminOrCreator =
      conversation.admins.includes(userId) || conversation.createdBy.equals(userId);

    if (!isAdminOrCreator) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Only an admin or the group creator can delete this conversation",
        });
    }

    await messageModel.deleteMany({ conversationId: conversation._id });
    await conversation.remove();

    return res
      .status(200)
      .json({ success: true, message: "Group conversation deleted" });
  }
});

export const seenConversation=asyncHandler(async(req,res,next)=>{
  const { conversationId } = req.params; 

  const userId = req.user?._id || req.owner?._id || req.tripLeader?._id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const conversation = await conversationModel.findById(conversationId);

  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  const isParticipant = conversation.participants.includes(userId);
  if (!isParticipant) {
    return res.status(403).json({ success: false, message: "You are not a participant in this conversation" });
  }

  conversation.lastMessage.seen = true;
  await conversation.save();

  res.status(200).json({
    success: true,
    message: "Last message marked as seen",
    conversation,
  });
})
