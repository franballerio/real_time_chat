import { pool } from '../../services/db.conn.js'

export class ChatService {
  static async createChat({ chat_id, producer, consumer }) {
    try {
      const { rows } = await pool.query('SELECT _id FROM chats WHERE _id = $1', [chat_id])
      const existentChat = rows[0]
      if ( existentChat ) throw new Error('Chat existed')
      
      await pool.query('INSERT INTO chats (_id) VALUES ($1)', [chat_id])
      await pool.query('INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)', [chat_id, producer, consumer])
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }

  static async newMessage({ msg, chat_id, reciever, sender, senderUsername }) {
    try {
      await pool.query('INSERT INTO messages (chat_id, sender_id, sender_username, receiver_id, text) values ($1,$2,$3,$4,$5)', [chat_id, sender, senderUsername, reciever, msg])

      return {
        chatId: chat_id,
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
      const { rows } = await pool.query('SELECT _id FROM chats WHERE _id = $1', [chat_id])
      const chat = rows[0]
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
        created_at
      FROM 
        messages 
      WHERE 
        chat_id = $1
      ORDER BY
        created_at DESC
      `
      const { rows } = await pool.query(query, [chat_id])
      return rows
    } catch (e) {
      throw e
    }
  }
}
