import { Router } from "express";
import * as notficationController from "./controller/notification.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./notification.validation.js";
import auth from "../../middleware/auth.js";

const router = Router();

router.post('/',auth, notficationController.createNotification);
router.get('/',auth, notficationController.getNotifications);
router.delete('/removeNotifications',auth,notficationController.deleteNotification)
router.patch('/markRead',auth,notficationController.isRead)

export default router;
