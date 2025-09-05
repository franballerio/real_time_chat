export const ioController = ({ io, dbModel }) => {

    io.use((socket, next) => {
        const username = socket.handshake.auth.user_name
        const id = socket.handshake.auth.userID
        if (!username) return new Error('Invalid username')

        socket.user_name = username
        socket.userID = id
        next()
    })


    io.on('connection', async (socket) => {
        console.log(`Client: ${socket.user_name} has connected!`)

        // send to all connections the new user
        socket.broadcast.emit('user connected', {
            userSocketID: socket.id,
            user_name: socket.user_name,
        });

        // we send to the user, all connected users
        const users = [];
        for (let [id, connectedSocket] of io.of("/").sockets) {
            if (socket.handshake.auth.user_name != connectedSocket.user_name)
                users.push({
                    userID: connectedSocket.userID,
                    user_name: connectedSocket.user_name,
                });
        }

        socket.emit('users', users);
        // remove conected users and show all existing users
        
        


        socket.on("disconnect", () => {
            console.log(`Client: ${socket.user_name} has disconnected!`);
        })

        socket.on('joinRoom', async ({ room , users}) => {
            try {
                if (!socket.rooms.has(room)) {
                    console.log(`User ${socket.userID} joining room: ${room}`)
                    
                    const newChat = await dbModel.createChat({room, users})
                    socket.join(room)
                }
            } catch (error) {
                console.error('Error joining room:', error)
                socket.emit('error', { message: 'Failed to join room' })
            }
        })

        socket.on("chat message", async ({ msg, room, reciever }) => {
            try {
                console.log("Received message:", { msg, room, reciever, sender: socket.userID });
                
                const newMessage = await dbModel.newMessage({
                    msg, 
                    room, 
                    reciever, 
                    sender: socket.userID
                })
                
                console.log("Message saved:", newMessage._id);

                io.to(room).emit("chat message", {
                    content: msg,
                    from: socket.user_name,
                    to: reciever,
                    messageId: newMessage._id,
                    timestamp: newMessage.createdAt
                });
            } catch (error) {
                console.error('Error handling chat message:', error)
                socket.emit('error', { message: 'Failed to send message' })
            }
        })

        // if (!socket.recovered) {
        //     const [result] = await connection.execute(
        //         "SELECT * FROM chat_messages WHERE id > ?", [socket.handshake.auth.serverOffset || 0]
        //     );

        //     result.forEach(row => {
        //         socket.emit("chat message", row.message, row.id, row.user);
        //     });
        // }

    })
}