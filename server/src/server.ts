// src/server.ts
import * as http from 'http';
import { Server } from "socket.io";

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

io.on('connection', (socket) => {
  console.log(`A user connected from origin: ${socket.handshake.headers.origin} with id: ${socket.id}`)

  socket.on('disconnect', () => {
    console.log(`User disconnected from origin: ${socket.handshake.headers.origin} with id: ${socket.id}`)
  });

  socket.on('click', (coordinate) => {
    console.log(`User clicked at ${coordinate} from origin: ${socket.handshake.headers.origin} with id: ${socket.id}`)
    // io.emit('message', message); // Broadcast the message to all connected clients
  });

  socket.on('stopped', (coordinate) => {
    console.log(`User stopped at ${coordinate} from origin: ${socket.handshake.headers.origin} with id: ${socket.id}`)
    // io.emit('message', message); // Broadcast the message to all connected clients
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});