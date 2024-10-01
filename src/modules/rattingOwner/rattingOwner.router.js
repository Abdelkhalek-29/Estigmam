import { Router } from "express";
import * as rattingController from "./controller/rattingOwner.js";
import auth from "../../middleware/auth.js";

const router = Router();

router.get("/",auth, rattingController.rattingOwner);

export default router;
