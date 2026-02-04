import DBlocal from 'db-local'

const { Schema } = new DBlocal({ path: './db' })

const Chat = Schema('Chat', {
  _id: { type: String, required: true },
  users: [{ type: String, ref: 'User' }],
  createdAt: { type: Date },
  updatedAt: { type: Date }
})

const Message = Schema('Message', {
  _id: { type: String, required: true },
  chatId: { type: String, ref: 'Chat', required: true },
  senderId: { type: String, ref: 'User', required: true },
  senderUsername: { type: String, ref: 'User', required: true },
  recieverId: { type: String, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date },
  readBy: [{ type: String, ref: 'User' }]
})

export class ChatRepository {
  static findOne(query) {
    return Chat.findOne(query)
  }

  static create(chat) {
    return Chat.create(chat).save()
  }

  static createMessage(message) {
    return Message.create(message).save()
  }

  static findMessages(query) {
    return Message.find(query)
  }
}
