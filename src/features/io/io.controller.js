import { ChatService } from '../chat/chat.service.js'

export const ioHandler = ({ io }) => {
	io.use((socket, next) => {
			const username = socket.handshake.auth.user_name
			const id = socket.handshake.auth.id
			if (!username) return new Error('Invalid username')

			socket.user_name = username
			socket.id = id
			next()
	})

	io.on('connection', async (socket) => {
			console.log(`Client: ${socket.user_name} has connected!`)

			// send to all connections the new user
			socket.broadcast.emit('user_connected', {
					id: socket.id,
					user_name: socket.user_name,
			});
			
			socket.on('disconnect', () => {
				console.log(`Client: ${socket.user_name} has disconnected!`);
			})

			socket.on('join_room', async ({ users }) => {
				try {
					const chat_id = users.sort().join('')           // create a consistent chat_id with the users id so it doesnt matter which user it is
					const chat = ChatService.fetchChat({ chat_id }) // check if there is a room created for this users
					
					if ( chat ) {
						const chatHistory = await ChatService.fetchHistory({ chat_id })
						chatHistory.sort().reverse()
						
						// TODO: implement a chat_history event, so we can send all history at once. Client side would take care of the logic of rendering history
						chatHistory.forEach(m => {
								io.to(room).emit('chat message', {
									content: m.text,
									from: m.sender_username,
									to: m.receiver_id,
									timestamp: m.created_at,
									read_at: m?.read_at || null
								});                    
						});
						return
					}
					
					await ChatService.createChat({ chat_id, users })
					socket.join(chat_id)
					return
				} catch (error) {
						console.error('Error joining room:', error)
						socket.emit('error', { message: 'Failed to join room' })
				}
			})

			socket.on('chat_message', async ({ msg, room, reciever }) => {
					try {
							console.log('Received message:', { msg, room, reciever, sender: socket.id });
							
							const newMessage = await ChatService.newMessage({
									msg, 
									room, 
									reciever, 
									sender: socket.id,
									senderUsername: socket.user_name
							})
							

							io.to(room).emit('chat_message', {
									content: newMessage.text,
									from: newMessage.senderUsername,
									to: newMessage.recieverId,
									timestamp: newMessage.createdAt,
									readBy: newMessage.readBy
							});
					} catch (error) {
							console.error('Error handling chat message:', error)
							socket.emit('error', { message: 'Failed to send message' })
					}
			})
	})
}