import express from "express";
import {
  getMessages,
  sendMessage,
  sendMessageToAll,
  getRoomMessages,
} from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/send", protectRoute, sendMessageToAll);
router.get("/getAll", protectRoute, getRoomMessages);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

export default router;
