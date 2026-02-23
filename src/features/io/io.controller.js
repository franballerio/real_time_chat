export const ioHandler = ({ io, ChatService }) => {
	io.use((socket, next) => {
			const user_name = socket.handshake.auth.user_name
			const user_id = socket.handshake.auth.user_id
			if (!user_name) return next(new Error('Invalid username'))
			if (!user_id) return next(new Error('Invalid id'))

			socket.user_name = user_name
			socket.user_id = user_id
			next()
	})

	io.on('connection', async (socket) => {
			console.log(`Client: ${socket.user_name} has connected!`)

			// send to all connections the new user
			socket.broadcast.emit('user_connected', {
					id: socket.user_id,
					user_name: socket.user_name,
			});
			
			socket.on('disconnect', () => {
				console.log(`Client: ${socket.user_name} has disconnected!`);
			})

			socket.on('join_room', async ({ producer, consumer }) => {
				try {
					const chat_id = [producer, consumer].sort().join('')  // create a consistent chat_id with the users id so it doesnt matter which user it is
					const chat = await ChatService.fetchChat({ chat_id }) 			// check if there is a room created for this users
					
					if ( chat ) {
						const chatHistory = await ChatService.fetchHistory({ chat_id })
						chatHistory.reverse()
						
						// TODO: implement a chat_history event, so we can send all history at once. Client side would take care of the logic of rendering history
						chatHistory.forEach(m => {
								io.to(chat_id).emit('chat_message', {
									content: m.text,
									from: m.sender_username,
									to: m.receiver_id,
									timestamp: m.created_at,
									read_at: null
								});                    
						});
					} else {
						await ChatService.createChat({ chat_id, producer, consumer })
					}
					socket.join(chat_id)
					return
				} catch (error) {
						console.error('Error joining room:', error)
						socket.emit('error', { message: 'Failed to join room' })
				}
			})

			socket.on('chat_message', async ({ msg, chat_id, reciever }) => {
					try {
							console.log('Received message:', { msg, chat_id, reciever, sender: socket.id });
							
							const newMessage = await ChatService.newMessage({
									msg, 
									chat_id, 
									reciever, 
									sender: socket.user_id,
									senderUsername: socket.user_name
							})
							

							io.to(chat_id).emit('chat_message', {
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