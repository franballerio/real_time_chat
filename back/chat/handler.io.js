import { Server } from "socket.io"
import { ChatService } from "./service.chat.js"
// import redis from '../redis/redis.client.js'
import colors from "colors";
const PORT = process.env.APP_PORT;

export const startIoServer = async (http_server) => {
	const io = new Server(http_server, {
		connectionStateRecovery: {},
		cors: { origin: '*' }  // must be an object — passing '*' directly breaks WebSocket upgrade Origin validation
	});

	console.log(
		colors.bold.green('4/5 '),
		`Socket.io server en socket://localhost:${PORT}`
	)

	// recieves the user_id from the frontend auth
	io.use((socket, next) => {
		const user_id = socket.handshake.auth.user_id
		const user_name = socket.handshake.auth.user_name
		const user_role = socket.handshake.auth.user_role
		if (!user_id || !user_name || !user_role) return next(
			new Error(`Error de autenticacion en socket.io: id: ${user_id}, name: ${user_name}, rol: ${user_role}`)
		)

		socket.user_id = user_id
		socket.user_name = user_name
		socket.user_role_id = user_role
		next()
	})

	io.on('connection', async (socket) => {
		console.log(`Client: ${socket.user_name} has connected!`)
		// agregaa al usuario que acaba de conectarse a la lista de usuarios online (redis)
		socket.join(socket.user_id)
		socket.join(socket.user_role_id)
		socket.join('general')
		// await redis.setOnline(socket.user_id)
		// OPTIONAL: enviar un evento de user connected
		socket.broadcast.emit('user_online', { user_id: socket.user_id })

		socket.on('heartbeat', () => {
			// redis.setOnline(socket.user_id)
		})

		socket.on('disconnect', async () => {
			console.log(`Client: ${socket.user_name} has disconnected!`);
			// checkeamos si el usuario no tiene mas de una pestaña abierta
			const matchingSockets = await io.in(socket.user_id).fetchSockets()
			// elimina el usuario de la lista de online (redis) 
			if (matchingSockets.length === 0) {
				// await redis.setOffline(socket.user_id)
				socket.broadcast.emit('user_offline', { user_id: socket.user_id })
			}
			return
		})

		socket.on('join_room', async ({ producer, consumer }) => {
			// producer y consumer siempre son los id de usuarios
			await join_room({ socket: socket, io: io, producer: producer, consumer: consumer })
		})

		socket.on('join_group_room', async ({ group_id, user_id }) => {
			await join_group_room({ socket: socket, io: io, group_id: group_id, user_id: user_id })
		})

		socket.on('chat_message', async ({ content, chat_id, sender_name, sender_id }) => {
			await send_message({
				socket: socket,
				io: io,
				content: content,
				chat_id: chat_id,
				sender_name: sender_name,
				sender_id: sender_id
			})
		})

		socket.on('group_message', async ({ content, group_id, sender_id, sender_name, created_at }) => {
			await send_group_message({
				socket: socket,
				io: io,
				content: content,
				group_id: group_id,
				sender_id: sender_id,
				sender_name: sender_name,
				created_at: created_at
			})
		})

		socket.on('broadcast_message', async (payload) => {
			const { content, sender_id, sender_name, target_roles, timestamp } = payload
			if (socket.user_role_id !== 1) throw new Error('No autorizado')

			try {
				if (target_roles[0] === 'all') {
					io.to('general').emit('broadcast_message', payload)
				} else {
					target_roles.forEach(role_id => {
						io.to(`${role_id}`).emit('broadcast_message', payload)
					});
				}
				const broadcast = await ChatService.newBroadcast({
					content,
					sender_id,
					sender_name,
					target_roles: JSON.stringify(target_roles),
					timestamp
				})
			} catch (error) {
				console.log(error)
			}
		})

		socket.on('group_created', async ({ group_id, members, created_by }) => {
			console.log(`Group created: ${group_id} by user ${created_by}`)
			// Notify all members that a new group was created
			members.forEach(member_id => {
				io.to(member_id).emit('group_created', {
					group_id: group_id,
					created_by: created_by
				})
			})
		})

		socket.on('member_added_to_group', async ({ group_id, new_members }) => {
			console.log(`Members added to group ${group_id}:`, new_members)
			// Notify newly added members
			new_members.forEach(member_id => {
				io.to(member_id).emit('added_to_group', {
					group_id: group_id
				})
			})
			// Notify existing members about the new additions
			io.to(group_id).emit('member_added_to_group', {
				group_id: group_id,
				new_members: new_members
			})
		})

		socket.on('user_left_group', async ({ group_id, user_id }) => {
			console.log(`User ${user_id} left group ${group_id}`)

			// If the socket belongs to the user leaving, they leave directly
			if (socket.user_id === user_id) {
				socket.leave(group_id)
			} else {
				// If someone else (like an admin) removed them, we need to make the removed user's sockets leave
				const sockets = await io.in(user_id).fetchSockets()
				for (const s of sockets) {
					s.leave(group_id)
				}
			}

			// Notify group members (including the user who just left so their frontend can update)
			io.to(group_id).emit('user_left_group', {
				group_id: group_id,
				user_id: user_id
			})
			// Also notify the specific user in case they need to close the group view
			io.to(user_id).emit('user_left_group_notification', {
				group_id: group_id,
				user_id: user_id
			})
		})

		socket.on('group_deleted', async ({ group_id, members }) => {
			console.log(`Group ${group_id} deleted`)
			// Notify all group members that the group was deleted
			members.forEach(member_id => {
				io.to(member_id).emit('group_deleted', {
					group_id: group_id
				})
			})
			// Close the group chat room
			io.to(group_id).emit('group_deleted', {
				group_id: group_id
			})
		})

	})
}

const join_room = async ({ socket, io, producer, consumer }) => {
	try {
		// create a consistent chat_id with the users id so it doesnt matter which user it is
		const chat_id = [producer, consumer].sort().join('')
		// check if there is a room created for this users
		const chat = await ChatService.fetchChat({ chat_id })
		if (!chat) await ChatService.createChat({ chat_id, producer, consumer });

		socket.join(chat_id);
		console.log(`${socket.user_name} joined room ${chat_id}`);
		return chat_id
	} catch (error) {
		console.error('Error joining room:', error);
		socket.emit('error', { message: 'Failed to join room' });
	}
}

const join_group_room = async ({ socket, io, group_id, user_id }) => {
	try {
		socket.join(group_id);
		console.log(`User ${user_id} (${socket.user_name}) joined group room ${group_id}`);

		// Notify other members that user joined
		socket.broadcast.to(group_id).emit('member_joined_group', {
			group_id: group_id,
			user_id: user_id,
			user_name: socket.user_name
		});

		return group_id;
	} catch (error) {
		console.error('Error joining group room:', error);
		socket.emit('error', { message: 'Failed to join group room' });
	}
}

const send_message = async ({ socket, io, content, chat_id, sender_name, sender_id }) => {
	try {
		console.log('Received message:', { content, chat_id, sender_name, sender_id });

		const newMessage = await ChatService.newMessage({
			content: content,
			chat_id: chat_id,
			sender_id: sender_id,
			sender_name: sender_name
		})

		io.to(chat_id).emit('chat_message', {
			content: content,
			from: sender_id,
			sender_id: sender_id,
			sender_name: sender_name,
			chat_id: chat_id,
			created_at: newMessage.createdAt,
			timestamp: newMessage.createdAt,
		});
	} catch (error) {
		console.error('Error handling chat message:', error)
		socket.emit('error', { message: 'Failed to send message' })
	}
}

const send_group_message = async ({ socket, io, content, group_id, sender_id, sender_name, created_at }) => {
	try {
		console.log('Received group message:', { content, group_id, sender_id, sender_name });

		const message = await ChatService.addGroupMessage({
			content: content,
			group_id: group_id,
			sender_id: sender_id,
			sender_name: sender_name,
			created_at: created_at
		})

		// Broadcast the message to all members in the group
		io.to(group_id).emit('group_message', {
			content: content,
			group_id: group_id,
			sender_id: sender_id,
			sender_name: sender_name,
			created_at: created_at,
			timestamp: created_at,
		});
	} catch (error) {
		console.error('Error handling group message:', error)
		socket.emit('error', { message: 'Failed to send group message' })
	}
}