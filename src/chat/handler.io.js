import { Server } from "socket.io"
import { ChatService } from "./service.chat.js"
import redis from '../redis/redis.client.js'
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
		await redis.setOnline(socket.user_id)
		// OPTIONAL: enviar un evento de user connected
		socket.broadcast.emit('user_online', { user_id: socket.user_id })

		socket.on('heartbeat', () => {
			redis.setOnline(socket.user_id)
		})

		socket.on('disconnect', async () => {
			console.log(`Client: ${socket.user_name} has disconnected!`);
			// checkeamos si el usuario no tiene mas de una pestaña abierta
			const matchingSockets = await io.in(socket.user_id).fetchSockets()
			// elimina el usuario de la lista de online (redis) 
			if (matchingSockets.length === 0) {
				await redis.setOffline(socket.user_id)
				socket.broadcast.emit('user_offline', { user_id: socket.user_id })
			}
			return
		})

		socket.on('join_room', async ({ producer, consumer }) => {
			// producer y consumer siempre son los id de usuarios
			await join_room({ socket: this.socket, producer: producer, consumer: consumer })
		})

		socket.on('chat_message', async ({ content, chat_id, reciever_id, sender_id }) => {
			await send_message({
				socket: this.socket,
				content: content,
				chat_id: chat_id,
				reciever_id: reciever_id,
				sender_id: sender_id
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
				console.log(e)
			}
		})

		socket.on('group_created', async ({ participants }) => {
			const group_id = crypto.randomUUID()
		})

	})
}

const join_room = async ({ socket, producer, consumer }) => {
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

const send_message = async ({ socket, content, chat_id, reciever_id, sender_id }) => {
	try {
		console.log('Received message:', { content, chat_id, reciever_id, sender_id });

		const newMessage = await ChatService.newMessage({
			content: content,
			chat_id: chat_id,
			reciever_id: reciever_id,
			sender_id: sender_id
		})

		io.to(chat_id).emit('chat_message', {
			content: content,
			from: sender_id,
			to: reciever_id,
			timestamp: newMessage.createdAt,
		});
	} catch (error) {
		console.error('Error handling chat message:', error)
		socket.emit('error', { message: 'Failed to send message' })
	}
}