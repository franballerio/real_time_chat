import { ChatService } from "./service.chat.js"
import redis from "../redis/redis.client.js"

export class Chat {

  getChatHistory = async (req, res) => {
    const { chat_id } = req.body
    const chat_history = await ChatService.fetchChatHistory({ chat_id: chat_id })
    res.json(chat_history)
  }

  getOnlineUsers = async (req, res) => {
    const { user_id } = req.body
    const onlineUsers = await redis.getOnlineUsers({ user_id: user_id })
    res.json(onlineUsers)
  }

  getAnnouncements = async (req, res) => {
    const { role_id } = req.body
    const announcements = await ChatService.getAnnouncements({ role_id: role_id })
    res.json(announcements)
  }
}