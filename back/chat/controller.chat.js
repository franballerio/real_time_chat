import { ChatService } from "./service.chat.js"
// import redis from "../redis/redis.client.js"

export class Chat {

  getChatHistory = async (req, res) => {
    const { chat_id } = req.body
    const chat_history = await ChatService.fetchChatHistory({ chat_id: chat_id })
    res.json(chat_history)
  }

  // getOnlineUsers = async (req, res) => {
  //   const { user_id } = req.body
  //   const onlineUsers = await redis.getOnlineUsers({ user_id: user_id })
  //   res.json(onlineUsers)
  // }

  getAnnouncements = async (req, res) => {
    const { role_id } = req.body
    const announcements = await ChatService.getAnnouncements({ role_id: role_id })
    res.json(announcements)
  }

  createGroup = async (req, res) => {
    const { group_name, members, created_by } = req.body
    const group = await ChatService.createGroup({
      group_name: group_name,
      members: members,
      created_by: created_by
    })
    res.status(201).json(group)
  }

  getUserGroups = async (req, res) => {
    const { user_id } = req.body
    const groups = await ChatService.getUserGroups({ user_id })
    res.json(groups)
  }

  getGroupDetails = async (req, res) => {
    const { group_id } = req.body
    const group = await ChatService.getGroupDetails({ group_id })
    res.json(group)
  }

  getGroupChatHistory = async (req, res) => {
    const { group_id } = req.body
    const history = await ChatService.getGroupChatHistory({ group_id })
    res.json(history)
  }

  leaveGroup = async (req, res) => {
    const { group_id, user_id } = req.body
    const result = await ChatService.leaveGroup({ group_id, user_id })
    res.json(result)
  }

  addMembersToGroup = async (req, res) => {
    const { group_id, user_ids } = req.body
    const group = await ChatService.addMembersToGroup({ group_id, user_ids })
    res.json(group)
  }

  deleteGroup = async (req, res) => {
    const { group_id } = req.body
    const result = await ChatService.deleteGroup({ group_id })
    res.json(result)
  }
}