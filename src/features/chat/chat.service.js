import { pool } from '../../services/db.conn.js'

export class ChatService {
  static async createChat({ chat_id, users }) {
    try {
      const rows = await pool.query('SELECT id FROM chats WHERE _id = $1', [chat_id])
      const existentChat = rows[0]
      if ( existentChat ) throw new Error('Chat existed')
      
      await pool.query('INSERT INTO chats (_id) VALUES ($1)', [chat_id])
      await pool.query('INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)', [chat_id, users[0], users[1]])
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }

  static async newMessage({ msg, chat_id, reciever, sender, senderUsername }) {
    try {
      await pool.query('INSERT INTO messages (chat_id, sender_id, sender_username, receiver_id, text) values ($1,$2,$3,$4,$5)', [chat_id, sender, senderUsername, reciever, msg])

      return {
        chatId: room,
        senderId: sender,
        senderUsername: senderUsername,
        recieverId: reciever,
        text: msg,
        createdAt: new Date().toISOString(),
        readBy: [sender]
      }
    } catch (error) {
      console.error('Error creating message:', error)
      throw error
    }
  }

  static async fetchChat({ chat_id }) {
    try {
      const rows = await pool.query('SELECT id FROM chats WHERE _id = $1', [chat_id])
      const chat = rows[0] ? rows.length > 0 : null
      return chat
    } catch (e) {
      throw e
    }
  }

  static async fetchHistory({ chat_id }) {
    try {
      const query = `
      SELECT 
        sender_id, 
        sender_username, 
        receiver_id, 
        text, 
        created_at, 
        read_at 
      FROM 
        messages 
      JOIN 
        messages_read_status
      ON
        _id = message_id
      WHERE 
        chat_id = $1
      `
      const rows = await pool.query(query, [chat_id])
      const chat = rows[0] ? rows.length > 0 : null
      return chat
    } catch (e) {
      throw e
    }
  }
}
