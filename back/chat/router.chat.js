import { Router } from "express";

import { Chat } from "./controller.chat.js"
import { verificarToken } from "../jsonwebtoken.js";


export const chatRouter = Router();
const chatController = new Chat()
/*                                                      Activos                                                    */
chatRouter.post("/getChatHistory", verificarToken, chatController.getChatHistory)
// chatRouter.post("/getOnlineUsers", verificarToken, chatController.getOnlineUsers)
chatRouter.post("/announcements", verificarToken, chatController.getAnnouncements)
chatRouter.post("/createGroup", verificarToken, chatController.createGroup)
chatRouter.post("/getUserGroups", verificarToken, chatController.getUserGroups)
chatRouter.post("/getGroupDetails", verificarToken, chatController.getGroupDetails)
chatRouter.post("/getGroupChatHistory", verificarToken, chatController.getGroupChatHistory)
chatRouter.post("/leaveGroup", verificarToken, chatController.leaveGroup)
chatRouter.post("/addMembersToGroup", verificarToken, chatController.addMembersToGroup)
chatRouter.post("/deleteGroup", verificarToken, chatController.deleteGroup)
