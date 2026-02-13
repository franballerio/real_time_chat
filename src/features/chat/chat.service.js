

// export class ChatService {
//   static async createChat({ room, users }) {
//     try {
//       const existentChat = ChatRepository.findOne({ _id: room })
//       const now = new Date().toISOString()

//       if (!existentChat) {
//         ChatRepository.create({
//           _id: room,
//           users: users,
//           createdAt: now,
//           updatedAt: now
//         })
//         console.log(`Chat created: ${room}`)
//       } else {
//         console.log(`Chat already exists: ${room}`)
//       }
//       return room
//     } catch (error) {
//       console.error('Error creating chat:', error)
//       throw error
//     }
//   }

//   static async newMessage({ msg, room, reciever, sender, senderUsername }) {
//     try {
//       const msgId = crypto.randomUUID()

//       const newMessage = ChatRepository.createMessage({
//         _id: msgId,
//         chatId: room,
//         senderId: sender,
//         senderUsername: senderUsername,
//         recieverId: reciever,
//         text: msg,
//         createdAt: new Date().toISOString(),
//         readBy: [sender]
//       })

//       console.log(`Message created: ${msgId}`)
//       return newMessage
//     } catch (error) {
//       console.error('Error creating message:', error)
//       throw error
//     }
//   }

//   static async fetchChat({ room }) {
//     return await ChatRepository.findMessages(m => m.chatId === room)
//   }
// }
