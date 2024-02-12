// src/server.ts
import * as http from 'http';
import { Server } from "socket.io";
import { UserConnection } from './userConnection';

const server = http.createServer();
const PORT = process.env.PORT || 3000;
const io = new Server(server, {
  cors: { origin: '*' }
});

let userConnections: UserConnection[] = [];

var os = require('os');
var networkInterfaces = os.networkInterfaces();
const networkIpAddress = networkInterfaces['Wi-Fi 4'].find((x: any) => x.family == 'IPv4').address;

io.on('connection', (socket) => {
  let firstConnection = userConnections.length == 0;

  const ip = socket.conn.remoteAddress.split(":")[3]; // when behind proxy: socket.handshake.headers['x-forwarded-for']
  let user = userConnections.find(x => x.ipAddress == ip);
  if (!user){
    // actually a new user connecting for the first time
    user = { id: crypto.randomUUID(), ipAddress: ip, socketIds: [socket.id], currentTileRow: 47, currentTileCol: 2, admin: firstConnection };
    userConnections.push(user);
    console.log(`A user connected from origin: ${ip} with id: ${socket.id}`);
  } else {
    // open another tab after connecting
    user.socketIds.push(socket.id);
    console.log(`Duplicate connection from user with origin: ${user.ipAddress} with id: ${socket.id}`);
  }

  if (user.socketIds.length == 1)
  {
    // either an initial connection, or a re-connect after closing all instances/tabs so we want to let everyone know
    socket.broadcast.emit("initialize-player", user.id, user.currentTileRow, user.currentTileCol, false, false);
  }
  socket.emit("initialize-player", user.id, user.currentTileRow, user.currentTileCol, true, user.admin);
  
  socket.on('disconnect', () => {
    let idx = user.socketIds.findIndex(x => x == socket.id);
    if (idx != -1)
    {
      user.socketIds.splice(idx, 1);
    }

    if (user.socketIds.length == 0)
    {
      // trigger despawn on all clients, but keep info incase of reconnect
      socket.broadcast.emit("remove-player", user.id);
      console.log(`User disconnected from origin: ${ip} with id: ${socket.id}`);
    }
  });

  socket.on('click', (coordinate) => {
    console.log(`User clicked at ${coordinate} from origin: ${ip} with id: ${socket.id}`)
    // io.emit('message', message); // Broadcast the message to all connected clients
  });

  socket.on('stopped', (coordinate) => {
    console.log(`User stopped at ${coordinate} from origin: ${ip} with id: ${socket.id}`)
    // io.emit('message', message); // Broadcast the message to all connected clients
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on ${networkIpAddress}:${PORT}`);
});