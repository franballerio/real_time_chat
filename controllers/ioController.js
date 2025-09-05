export const ioController = ({ io, dbModel }) => {

    io.use((socket, next) => {
        const username = socket.handshake.auth.user_name
        const id = socket.handshake.auth.userId
        if (!username) return new Error('Invalid username')

        socket.user_name = username
        socket.userId = id
        next()
    })


    io.on('connection', async (socket) => {
        console.log(`Client: ${socket.user_name} has connected!`)

        // send to all connections the new user
        socket.broadcast.emit('user connected', {
            userSocketId: socket.id,
            user_name: socket.user_name,
        });

        const users = await dbModel.getUsers(socket.user_name)
        socket.emit('users', users);
        
        socket.on('disconnect', () => {
            console.log(`Client: ${socket.user_name} has disconnected!`);
        })

        socket.on('joinRoom', async ({ room , users}) => {
            try {
                if (!socket.rooms.has(room)) {
                    console.log(`User ${socket.userId} joining room: ${room}`)
                    
                    const newChat = await dbModel.createChat({ room, users })
                    socket.join(room)
                }

                const chatHistory = await dbModel.fetchChat({ room })
                chatHistory.sort().reverse()

                chatHistory.forEach(m => {
                    io.to(room).emit('chat message', {
                        content: m.text,
                        from: m.senderUsername,
                        to: m.recieverId,
                        timestamp: m.createdAt,
                        readBy: m.readBy
                    });                    
                });
            } catch (error) {
                console.error('Error joining room:', error)
                socket.emit('error', { message: 'Failed to join room' })
            }
        })

        socket.on('chat message', async ({ msg, room, reciever }) => {
            try {
                console.log('Received message:', { msg, room, reciever, sender: socket.userId });
                
                const newMessage = await dbModel.newMessage({
                    msg, 
                    room, 
                    reciever, 
                    sender: socket.userId,
                    senderUsername: socket.user_name
                })
                
                console.log(newMessage);

                io.to(room).emit('chat message', {
                    content: newMessage.text,
                    from: newMessage.senderUsername,
                    to: newMessage.reciever,
                    timestamp: newMessage.createdAt,
                    readBy: newMessage.readBy
                });
            } catch (error) {
                console.error('Error handling chat message:', error)
                socket.emit('error', { message: 'Failed to send message' })
            }
        })

        // if (!socket.recovered) {
        //     const [result] = await connection.execute(
        //         'SELECT * FROM chat_messages WHERE id > ?', [socket.handshake.auth.serverOffset || 0]
        //     );

        //     result.forEach(row => {
        //         socket.emit('chat message', row.message, row.id, row.user);
        //     });
        // }

    })
}