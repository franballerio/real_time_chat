import { poolChat } from '../dbManager.js'

export class ChatService {
  static async createChat({ chat_id, producer, consumer }) {
    try {
      // Corrected query syntax
      const [rows] = await poolChat.query('SELECT _id FROM chats WHERE _id = ?', [chat_id]);
      const existentChat = rows[0];
      if (existentChat) throw new Error('Chat existed');

      // Use transactions for atomicity
      const connection = await poolChat.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query('INSERT INTO chats (_id) VALUES (?)', [chat_id]);
        await connection.query('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?), (?, ?)', [chat_id, producer, chat_id, consumer]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  static async newMessage({ content, chat_id, reciever_id, sender_id }) {
    try {
      // Corrected query syntaxjo
      await poolChat.query(`
        INSERT INTO messages (chat_id, sender_id, receiver_id, text)
        VALUES (?, ?, ?, ?)`
        , [chat_id, sender_id, reciever_id, content]);

      return {
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  static async fetchChat({ chat_id }) {
    try {
      // Corrected query syntax and result handling
      const [rows] = await poolChat.query('SELECT _id FROM chats WHERE _id = ?', [chat_id]);
      return rows[0]; // Returns the chat object or undefined
    } catch (e) {
      console.error('Error fetching chat:', e);
      throw e;
    }
  }

  static async fetchChatHistory({ chat_id }) {
    console.log('fetching hostory for chat:', chat_id)
    try {
      const query = `
      SELECT 
        sender_id,
        receiver_id, 
        text as content, 
        created_at
      FROM 
        messages
      WHERE 
        chat_id = ?
      ORDER BY
        created_at ASC
      `;
      const [rows] = await poolChat.query(query, [chat_id]);
      return rows;
    } catch (e) {
      console.error('Error fetching chat history:', e);
      throw e;
    }
  }

  static async newBroadcast({ content, sender_id, sender_name, target_roles }) {
    try {
      const query = `
        INSERT INTO broadcasts (sender_name, sender_id, target_roles, content)
        VALUES (?,?,?,?)
      `
      const args = [sender_name, sender_id, target_roles, content]
      const [rows] = await poolChat.query(query, args)
      return rows
    } catch (e) {
      console.error('Error creating broadcast:', e);
      throw e
    }
  }

  static async getAnnouncements({ role_id }) {
    try {
      const query = `
        SELECT 
          sender_id,  
          target_roles,  
          content, 
          sender_name,
          created_at as timestamp
        FROM 
          broadcasts
        WHERE 
          JSON_CONTAINS(target_roles, ?) = 1
          OR JSON_CONTAINS(target_roles, '"all"') = 1
        ORDER BY created_at DESC;
      `
      const args = `"${role_id}"`
      const [rows] = await poolChat.query(query, args)
      return rows
    } catch (e) {
      console.error('Error creating broadcast:', e);
      throw e
    }
  }
}
