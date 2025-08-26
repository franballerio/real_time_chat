import 'dotenv/config'
import express from "express";
import { Server } from "socket.io"
import { createServer } from "node:http"

const port = process.env.PORT

const app = express();
const http_server = createServer(app);
const io = new Server(http_server)

io.on("connection", (socket) => {
    console.log("Cliente conectado!")

    socket.on("disconnect", () => {
        console.log(`Client: ${socket.client} has disconnected`);
    })

    socket.on("chat message", (msg) => {
        console.log("Mensaje recibido: " + msg);
        io.emit("chat message", msg);
    })
})

app.get("/", (req, res) => {
    res.sendFile(process.cwd() + "/client/index.html")
})

http_server.listen(port, () => {
    console.log(`Servidor escuchando en puerto ${port}`)
})