import { v4 as uuidv4 } from 'uuid';

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

  static async newMessage({ content, chat_id, sender_name, sender_id }) {
    try {
      // Corrected query syntax
      await poolChat.query(`
        INSERT INTO messages (_id, chat_id, sender_id, sender_name, text)
        VALUES (?,?,?,?,?)`
        , [uuidv4(), chat_id, sender_id, sender_name, content]);

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
        INSERT INTO broadcasts (_id, sender_id, target_roles, content, sender_name)
        VALUES (?,?,?,?,?)
      `
      const args = [uuidv4(), sender_id, target_roles, content, sender_name]
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
          b.sender_id,  
          b.target_roles,  
          b.content,
          u.title as sender_name,
          b.created_at as timestamp
        FROM 
          broadcasts b
        LEFT JOIN
          (
            SELECT 
              pu.id_usuario as _id, 
              CONCAT(IF(cg.abreviatura='Nodo','',concat(cg.abreviatura," ")),pu.nombre," ",pu.apellido) as title
            FROM personal.usuarios as pu
            JOIN common.grado as cg on pu.id_grado = cg.id_grado
          ) u ON b.sender_id = u._id
        WHERE 
          JSON_CONTAINS(b.target_roles, ?) = 1
          OR JSON_CONTAINS(b.target_roles, '"all"') = 1
        ORDER BY b.created_at DESC;
      `
      const args = [`"${role_id}"`]
      const [rows] = await poolChat.query(query, args)
      return rows
    } catch (e) {
      console.error('Error fetching announcements:', e);
      throw e
    }
  }

  static async createGroup({ group_name, members, created_by }) {
    try {
      const group_id = uuidv4()
      const connection = await poolChat.getConnection();

      try {
        await connection.beginTransaction();

        // Create the group
        const query1 = `
          INSERT INTO chats (_id, type, name, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `
        await connection.query(query1, [group_id, 'group', group_name, created_by])

        // Add members to the group
        for (const member of members) {
          const query2 = `
            INSERT INTO chat_participants (chat_id, user_id)
            VALUES (?, ?)
          `
          await connection.query(query2, [group_id, member])
        }

        await connection.commit();

        // Fetch and return the created group with members
        const group = await this.getGroupDetails({ group_id });
        return group;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (e) {
      console.error('Error creating group:', e);
      throw e;
    }
  }

  static async getUserGroups({ user_id }) {
    try {
      // First query: Get all group IDs that the user is in
      const getGroupIdsQuery = `
        SELECT DISTINCT c._id
        FROM chats c
        INNER JOIN chat_participants cp ON c._id = cp.chat_id
        WHERE c.type = 'group' AND cp.user_id = ?
        ORDER BY c.updated_at DESC
      `
      const [groupIdRows] = await poolChat.query(getGroupIdsQuery, [user_id]);

      if (groupIdRows.length === 0) {
        return [];
      }

      const groupIds = groupIdRows.map(row => row._id);

      // Second query: Get all chat info and participants for those groups
      const placeholders = groupIds.map(() => '?').join(',');
      const getGroupDetailsQuery = `
        SELECT 
          c._id,
          c.name as group_name,
          c.type,
          c.created_by,
          c.created_at,
          c.updated_at,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              '_id', u._id,
              'title', u.title,
              'usuario', u.usuario
            )
          ) as members,
          COUNT(DISTINCT cp.user_id) as member_count
        FROM 
          chats c
        INNER JOIN
          chat_participants cp ON c._id = cp.chat_id
        LEFT JOIN
          (
            SELECT 
              pu.id_usuario as _id, 
              pu.usuario, 
              CONCAT(IF(cg.abreviatura='Nodo','',concat(cg.abreviatura," ")),pu.nombre," ",pu.apellido) as title
            FROM personal.usuarios as pu
            JOIN common.grado as cg on pu.id_grado = cg.id_grado
          ) u ON cp.user_id = u._id
        WHERE 
          c._id IN (${placeholders})
        GROUP BY 
          c._id, c.name, c.type, c.created_by, c.created_at, c.updated_at
        ORDER BY 
          c.updated_at DESC
      `
      const [rows] = await poolChat.query(getGroupDetailsQuery, groupIds);
      return rows.map(row => ({
        ...row,
        members: typeof row.members === 'string' ? JSON.parse(row.members) : (row.members || [])
      }));
    } catch (e) {
      console.error('Error fetching user groups:', e);
      throw e;
    }
  }

  static async getGroupDetails({ group_id }) {
    try {
      const query = `
        SELECT 
          c._id,
          c.name as group_name,
          c.type,
          c.created_by,
          c.created_at,
          c.updated_at,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              '_id', u._id,
              'title', u.title,
              'usuario', u.usuario
            )
          ) as members,
          COUNT(DISTINCT cp.user_id) as member_count
        FROM 
          chats c
        INNER JOIN 
          chat_participants cp ON c._id = cp.chat_id
        LEFT JOIN
          (
            SELECT 
              pu.id_usuario as _id, 
              pu.usuario, 
              CONCAT(IF(cg.abreviatura='Nodo','',concat(cg.abreviatura," ")),pu.nombre," ",pu.apellido) as title
            FROM personal.usuarios as pu
            JOIN common.grado as cg on pu.id_grado = cg.id_grado
          ) u ON cp.user_id = u._id
        WHERE 
          c._id = ? AND c.type = 'group'
        GROUP BY 
          c._id, c.name, c.type, c.created_by, c.created_at, c.updated_at
      `
      const [rows] = await poolChat.query(query, [group_id]);
      if (rows.length > 0) {
        return {
          ...rows[0],
          members: typeof rows[0].members === 'string' ? JSON.parse(rows[0].members) : (rows[0].members || [])
        };
      }
      return null;
    } catch (e) {
      console.error('Error fetching group details:', e);
      throw e;
    }
  }

  static async getGroupChatHistory({ group_id }) {
    try {
      const query = `
        SELECT 
          m.sender_id,
          u.usuario as sender_name,
          u.title as sender_full_name,
          m.text as content,
          m.created_at,
          m.chat_id as group_id
        FROM 
          messages m
        INNER JOIN
          (
            SELECT 
              pu.id_usuario as _id, 
              pu.usuario, 
              CONCAT(IF(cg.abreviatura='Nodo','',concat(cg.abreviatura," ")),pu.nombre," ",pu.apellido) as title
            FROM personal.usuarios as pu
            JOIN common.grado as cg on pu.id_grado = cg.id_grado
          ) u ON m.sender_id = u._id
        WHERE 
          m.chat_id = ?
        ORDER BY
          m.created_at ASC
      `
      const [rows] = await poolChat.query(query, [group_id]);
      return rows;
    } catch (e) {
      console.error('Error fetching group chat history:', e);
      throw e;
    }
  }

  static async leaveGroup({ group_id, user_id }) {
    try {
      const connection = await poolChat.getConnection();

      try {
        await connection.beginTransaction();

        // Remove user from group
        const query = `
          DELETE FROM chat_participants 
          WHERE chat_id = ? AND user_id = ?
        `
        await connection.query(query, [group_id, user_id]);

        // Check if group is empty
        const [rows] = await connection.query(
          'SELECT COUNT(*) as count FROM chat_participants WHERE chat_id = ?',
          [group_id]
        );

        // If no members left, delete the group
        if (rows[0].count === 0) {
          await connection.query('DELETE FROM chats WHERE _id = ?', [group_id]);
        } else {
          // Update the group's updated_at timestamp
          await connection.query(
            'UPDATE chats SET updated_at = NOW() WHERE _id = ?',
            [group_id]
          );
        }

        await connection.commit();
        return { success: true, message: 'Left group successfully' };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (e) {
      console.error('Error leaving group:', e);
      throw e;
    }
  }

  static async addMembersToGroup({ group_id, user_ids }) {
    try {
      const connection = await poolChat.getConnection();

      try {
        await connection.beginTransaction();

        // Add new members
        for (const user_id of user_ids) {
          const [existing] = await connection.query(
            'SELECT _id FROM chat_participants WHERE chat_id = ? AND user_id = ?',
            [group_id, user_id]
          );

          // Only add if not already a member
          if (existing.length === 0) {
            const query = `
              INSERT INTO chat_participants (chat_id, user_id, joined_at)
              VALUES (?, ?, NOW())
            `
            await connection.query(query, [group_id, user_id]);
          }
        }

        // Update the group's updated_at timestamp
        await connection.query(
          'UPDATE chats SET updated_at = NOW() WHERE _id = ?',
          [group_id]
        );

        await connection.commit();

        // Return updated group details
        const group = await this.getGroupDetails({ group_id });
        return group;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (e) {
      console.error('Error adding members to group:', e);
      throw e;
    }
  }

  static async deleteGroup({ group_id }) {
    try {
      const connection = await poolChat.getConnection();

      try {
        await connection.beginTransaction();

        // Delete all messages in the group
        await connection.query('DELETE FROM messages WHERE chat_id = ?', [group_id]);

        // Delete all participants
        await connection.query('DELETE FROM chat_participants WHERE chat_id = ?', [group_id]);

        // Delete the group
        await connection.query('DELETE FROM chats WHERE _id = ?', [group_id]);

        await connection.commit();
        return { success: true, message: 'Group deleted successfully' };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (e) {
      console.error('Error deleting group:', e);
      throw e;
    }
  }

  static async addGroupMessage({ content, group_id, sender_id, sender_name, created_at }) {
    try {
      const query = `
        INSERT INTO messages (_id, chat_id, sender_id, sender_username, text, created_at)
        VALUES (?,?,?,?,?, NOW())
      `
      await poolChat.query(query, [uuidv4(), group_id, sender_id, sender_name, content]);

      return {
        content,
        group_id,
        sender_id,
        sender_name,
        created_at: new Date().toISOString()
      };
    } catch (e) {
      console.error('Error adding group message:', e);
      throw e;
    }
  }
}
