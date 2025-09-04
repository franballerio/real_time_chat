export const ioController = ({ io, dbModel }) => {

    io.use((socket, next) => {
        const username = socket.handshake.auth.user_name
        const id = socket.handshake.auth.userID
        if (!username) return new Error('Invalid username')

        socket.user_name = username
        socket.userID = id
        next()
    })


    io.on("connection", async (socket) => {
        console.log(`Client: ${socket.user_name} has connected!`)

        // send to all connections the new user
        socket.broadcast.emit("user connected", {
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

        socket.emit("users", users);

        socket.on("disconnect", () => {
            console.log(`Client: ${socket.user_name} has disconnected!`);
        })

        socket.on('joinRoom', async ({ room , users}) => {
            if (!socket.rooms.has(room)) {
                console.log(`User ${users[0]} joining room: ${room}`)
                
                const newChat = await dbModel.createChat({room, ids: users})
                socket.join(room)
            }
        })

        socket.on("chat message", async ({ msg, room, reciever, sender }) => {
            const newMessage = dbModel.newMessage({
                msg, 
                room, 
                reciever, 
                sender: socket.userID  // Use socket.userID as sender                
            })
            console.log("Mensaje recibido: " + msg);

            io.to(room).emit("chat message", {
                content: msg,           // Use msg instead of undefined content
                from: socket.user_name, // Use socket.user_name instead of undefined from
                to: reciever,           // Use reciever instead of undefined to
                messageId: newMessage._id,
                timestamp: newMessage.createdAt
            });
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