import 'dotenv/config'
import express from "express";
import { Server } from "socket.io"
import { createServer } from "node:http"
import mysql from 'mysql2/promise';
import cors from 'cors';

const port = process.env.PORT

const app = express();
app.use(cors());
const http_server = createServer(app);
const io = new Server(http_server, {
  connectionStateRecovery: {}
});

const dbConfig = {
    host: 'localhost',
    port: 3307,
    user:  'root',
    password: '1234',
    database: 'messages'
};
const connection = await mysql.createConnection(dbConfig);

await connection.execute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message TEXT NOT NULL,
        user TEXT NOT NULL
    );
`);

io.on("connection", async (socket) => {
    console.log("Cliente conectado!")

    socket.on("disconnect", () => {
        console.log(`Client: ${socket.client} has disconnected`);
    })

    socket.on("chat message", async (msg) => {
        // console.log(msg)
        let result
        const username = socket.handshake.auth.username || "Anónimo"
        try {
            // console.log([msg, username]);
            [result] = await connection.execute("INSERT INTO chat_messages (message, user) VALUES (?, ?)", [msg, username]);
        }
        catch (error) {
            console.error("Error al guardar el mensaje en la base de datos:", error);
            return;
        }
        // console.log("Mensaje recibido: " + msg);
        io.emit("chat message", msg, result.insertId.toString(), username);
    })

    if (!socket.recovered) {
        const [result] = await connection.execute(
            "SELECT * FROM chat_messages WHERE id > ?", [socket.handshake.auth.serverOffset || 0]
        );
        
        result.forEach(row => {
            socket.emit("chat message", row.message, row.id, row.user);
        });
    }

})

app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/src/client/index.html")
})

http_server.listen(port, () => {
    console.log(`Servidor escuchando en puerto ${port}`)
})