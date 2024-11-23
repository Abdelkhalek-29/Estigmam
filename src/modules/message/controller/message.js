// import { getRecipientSocketId, io } from "../../../../index.js";
import conversationModel from "../../../../DB/model/conversation.model.js";
import GroupChat from "../../../../DB/model/groupChat,model.js";
import OwnerModel from "../../../../DB/model/Owner.model .js";
import tripLeaderModel from "../../../../DB/model/tripLeader.model.js";
import userModel from "../../../../DB/model/User.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import messageModel from "../../../../DB/model/message.model.js";
import { messaging } from "../../../utils/firebase.js"; // import your Firebase messaging utility

// import cloudinary from "../../../utils/cloud.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, text } = req.body;
  const senderId = req.user ? req.user._id : req.owner._id;

  if (!conversationId || !text) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  let conversation = null;
  let isGroupChat = false;

  conversation = await GroupChat.findById(conversationId);
  if (conversation) {
    isGroupChat = true;

    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this group chat",
      });
    }
  } else {
    const receiverId = conversationId;

    conversation = await conversationModel.findOne({
      participants: { $all: [senderId, receiverId] },
      isGroup: false,
    });

    if (!conversation) {
      conversation = await conversationModel.create({
        participants: [senderId, receiverId],
        isGroup: false,
        lastMessage: { text: "", senderId: null, seen: false },
      });
    }

    let receiver = null;

    receiver = await userModel
      .findById(receiverId)
      .select("userName profileImage");
    if (!receiver) {
      receiver = await OwnerModel.findById(receiverId).select(
        "userName profileImage"
      );
    }
    if (!receiver) {
      receiver = await tripLeaderModel
        .findById(receiverId)
        .select("userName profileImage");
    }

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }
  }

  const messageData = {
    text,
    senderId,
    seen: false,
    ...(isGroupChat
      ? { groupId: conversation._id }
      : { conversationId: conversation._id }),
  };

  const newMessage = await messageModel.create(messageData);

  conversation.lastMessage = {
    text,
    senderId,
    seen: false,
  };
  await conversation.save();

  const sendNotification = async (recipientId, message) => {
    const user = await userModel
      .findById(recipientId)
      .select("fcmToken userName");

    if (!user || !user.fcmToken) {
      console.log(`No FCM token found for user: ${recipientId}`);
      return;
    }
    const notificationPayload = {
      notification: {
        title: `New message from ${message.senderId}`,
        body: message.text,
      },
      data: {
        type: "Chat",
        senderName: message.senderId ? message.senderId : "",
      },
      token: user.fcmToken,
    };

    try {
      await messaging.send(notificationPayload);
      console.log(`Notification sent to ${recipientId}`);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  if (isGroupChat) {
    for (let participantId of conversation.participants) {
      if (participantId !== senderId) {
        await sendNotification(participantId, newMessage);
      }
    }
  } else {
    await sendNotification(conversationId, newMessage);
  }

  return res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: newMessage,
  });
});
export const getMessages = asyncHandler(async (req, res) => {
  const { otherUserId } = req.params; // `otherUserId` can be for private chat or group chat
  const userId = req.user
    ? req.user._id
    : req.owner
    ? req.owner._id
    : req.tripLeader._id;

  console.log("Received otherUserId:", otherUserId);
  console.log("Logged in userId:", userId);

  try {
    let conversation;
    let isGroupChat = false;

    // Check if it's a group chat
    const groupChat = await GroupChat.findById(otherUserId);
    if (groupChat) {
      isGroupChat = true;

      // Validate if the user is a participant in the group
      if (!groupChat.participants.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: "You are not a participant in this group chat",
        });
      }
      conversation = groupChat;
    } else {
      // Otherwise, treat it as a private conversation
      conversation = await conversationModel.findOne({
        participants: { $all: [userId, otherUserId] },
        isGroup: false,
      });

      // If no private conversation exists, create one
      if (!conversation) {
        conversation = await conversationModel.create({
          participants: [userId, otherUserId],
          isGroup: false,
          lastMessage: { seen: false },
        });
      }
    }

    console.log("Found/Created conversation:", conversation);

    // Fetch messages
    const messagesQuery = isGroupChat
      ? { groupId: conversation._id }
      : { conversationId: conversation._id };

    const messages = await messageModel
      .find(messagesQuery)
      .sort({ createdAt: 1 });

    console.log("Raw messages from DB:", messages);

    // Get participant details
    const participantIds = isGroupChat
      ? conversation.participants
      : [userId, otherUserId];

    const participants = await Promise.all(
      participantIds.map(async (participantId) => {
        const user =
          (await userModel
            .findById(participantId)
            .select("userName profileImage")) ||
          (await OwnerModel.findById(participantId).select(
            "userName profileImage"
          )) ||
          (await tripLeaderModel
            .findById(participantId)
            .select("userName profileImage"));
        return user
          ? {
              _id: user._id,
              userName: user.userName,
              profileImage: user.profileImage,
            }
          : { _id: participantId, userName: "Unknown", profileImage: null };
      })
    );

    // Format messages
    const formattedMessages = messages.map((message) => {
      const senderDetails = participants.find(
        (participant) =>
          participant._id.toString() === message.senderId.toString()
      ) || { userName: "Unknown", profileImage: null };

      return {
        _id: message._id,
        ...(isGroupChat
          ? { groupId: message.groupId }
          : { conversationId: message.conversationId }),
        senderId: message.senderId,
        userName: senderDetails.userName,
        profileImage: senderDetails.profileImage,
        text: message.text,
        seen: message.seen,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };
    });

    // Respond with formatted data
    return res.status(200).json({
      success: true,
      conversation: {
        _id: conversation._id,
        participants,
        groupName: isGroupChat ? conversation.groupName : undefined,
        groupImage: isGroupChat ? conversation.groupImage : undefined,
        isGroup: isGroupChat,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessage: conversation.lastMessage || { seen: false },
      },
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

export const getConversations = asyncHandler(async (req, res, next) => {
  const userId = req.user
    ? req.user._id
    : req.owner
    ? req.owner._id
    : req.tripLeader._id;

  // Private Conversations
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

  // Group Conversations
  const groupConversations = await GroupChat.aggregate([
    { $match: { participants: userId } },
    { $unwind: "$participants" },
    {
      $match: {
        participants: { $ne: userId },
      },
    },
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
      $project: {
        _id: 1,
        groupName: 1,
        groupImage: { $ifNull: ["$groupImage", null] },
        createdAt: 1,
        updatedAt: 1,
        participants: {
          $filter: {
            input: "$allParticipantDetails",
            as: "participant",
            cond: { $ne: ["$$participant._id", userId] },
          },
        },
      },
    },
    {
      $addFields: {
        groupImage: {
          $ifNull: ["$groupImage", "default-image-url"], // Default image if group image is null
        },
      },
    },
    {
      $lookup: {
        from: "messages",
        let: { groupId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$groupId", "$$groupId"] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "lastMessageDetails",
      },
    },
    {
      $addFields: {
        lastMessage: {
          $cond: {
            if: { $gt: [{ $size: "$lastMessageDetails" }, 0] },
            then: {
              senderId: { $arrayElemAt: ["$lastMessageDetails.senderId", 0] },
              senderName: {
                $arrayElemAt: ["$lastMessageDetails.senderName", 0],
              },
              text: { $arrayElemAt: ["$lastMessageDetails.text", 0] },
              seen: { $arrayElemAt: ["$lastMessageDetails.seen", 0] },
            },
            else: {
              senderId: null,
              senderName: null,
              text: "No messages yet", // You can use a default message here
              seen: false,
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        groupName: 1,
        groupImage: 1,
        participants: {
          _id: 1,
          userName: 1,
          profileImage: 1,
        },
        lastMessage: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  // Combine both private and group conversations
  const conversations = [...privateConversations, ...groupConversations];

  // Modify the image field: use group image if it's a group conversation, else use user profile image for private conversation
  const updatedConversations = conversations.map((conversation) => {
    if (conversation.groupName) {
      // For group conversation, use the group image
      conversation.image = conversation.groupImage;
    } else if (conversation.participants && conversation.participants[0]) {
      // For private conversation, use the user's profile image
      conversation.image = conversation.participants[0].profileImage;
    }
    return conversation;
  });

  return res
    .status(200)
    .json({ success: true, conversations: updatedConversations });
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
      return res.status(403).json({
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
      conversation.admins.includes(userId) ||
      conversation.createdBy.equals(userId);

    if (!isAdminOrCreator) {
      return res.status(403).json({
        success: false,
        message:
          "Only an admin or the group creator can delete this conversation",
      });
    }

    await messageModel.deleteMany({ conversationId: conversation._id });
    await conversation.remove();

    return res
      .status(200)
      .json({ success: true, message: "Group conversation deleted" });
  }
});

export const seenConversation = asyncHandler(async (req, res, next) => {
  const { conversationId } = req.params;

  const userId = req.user?._id || req.owner?._id || req.tripLeader?._id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const conversation = await conversationModel.findById(conversationId);

  if (!conversation) {
    return res
      .status(404)
      .json({ success: false, message: "Conversation not found" });
  }

  const isParticipant = conversation.participants.includes(userId);
  if (!isParticipant) {
    return res.status(403).json({
      success: false,
      message: "You are not a participant in this conversation",
    });
  }

  conversation.lastMessage.seen = true;
  await conversation.save();

  res.status(200).json({
    success: true,
    message: "Last message marked as seen",
    conversation,
  });
});
