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
const useAdmin = true;

io.on('connection', (socket) => {
    let firstConnection = useAdmin && userConnections.length == 0;
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
        socket.broadcast.emit('initialize-player', { userId: user.id, userTileRow: user.currentTileRow, userTileCol: user.currentTileCol, pov: false, shareVision: true, admin: false});
    }
    
    // initialize existing connections to the newly connected client
    for(let u of userConnections)
    {
        if (u.admin && userConnections.length > 1) {
            // admin is first to connect, so allow admin's client to initialize itself. but other clients don't need to initialize the admin player object
            continue;
        }
        const me = u.id == user.id;
        socket.emit('initialize-player', { userId: u.id, userTileRow: u.currentTileRow, userTileCol: u.currentTileCol, pov: me, shareVision: true, admin: u.admin});
    }

    socket.on('disconnect', () => {
        let idx = user.socketIds.findIndex(x => x == socket.id);
        if (idx != -1)
        {
            user.socketIds.splice(idx, 1);
        }   
        if (user.socketIds.length == 0)
        {
            // trigger despawn on all clients, but keep info incase of reconnect
            socket.broadcast.emit('remove-player', user.id);
            console.log(`User disconnected from origin: ${ip} with id: ${socket.id} - remembering ${userConnections.length} connections`);
        }
    });

    socket.on('click', (coordinate) => {
        user.currentTileRow = coordinate.tileRow;
        user.currentTileCol = coordinate.tileCol;
        console.log(`User clicked at r:${coordinate.tileRow} c:${coordinate.tileCol} from origin: ${ip} with id: ${socket.id}`);
        socket.broadcast.emit('move-player', user.id, user.currentTileRow, user.currentTileCol);
    });

    socket.on('stopped', (coordinate) => {
        user.currentTileRow = coordinate.tileRow;
        user.currentTileCol = coordinate.tileCol;
        console.log(`User stopped at r:${coordinate.tileRow} c:${coordinate.tileCol} from origin: ${ip} with id: ${socket.id}`);
        socket.broadcast.emit('stop-player', user.id, user.currentTileRow, user.currentTileCol);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on ${networkIpAddress}:${PORT}`);
});