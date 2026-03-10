import { Router } from "express";

import { Chat } from "./controller.chat.js"
import { verificarToken } from "../jsonwebtoken.js";


export const chatRouter = Router();
const chatController = new Chat()
/*                                                      Activos                                                    */
chatRouter.post("/getChatHistory", verificarToken, chatController.getChatHistory)
chatRouter.post("/getOnlineUsers", verificarToken, chatController.getOnlineUsers)
chatRouter.post("/announcements", verificarToken, chatController.getAnnouncements)
