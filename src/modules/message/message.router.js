// routes/auth.js
import { Router } from "express";
import * as messageController from "./controller/message.js";
import auth from "../../middleware/auth.js";
// import { fileUpload, filterObject } from "../../utils/multer.js";
const router = Router();
router.get("/conversation", auth, messageController.getConversations);
router.get("/:otherUserId", auth, messageController.getMessages);
router.post(
  "/send",
  auth,
  // fileUpload(filterObject.image).single("img"),
  messageController.sendMessage
);

router.delete('/:conversationId',auth, messageController.deleteConversation);
//message seen
router.patch("/seenConversation/:conversationId",auth,messageController.seenConversation)
export default router;
