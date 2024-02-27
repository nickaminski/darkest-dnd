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

let enemies = [
    { id: crypto.randomUUID(), imageName: 'bone_rabble', currentTileRow: 47, currentTileCol: 5 },
    { id: crypto.randomUUID(), imageName: 'bone_rabble', currentTileRow: 47, currentTileCol: 7 }
];

let playerImages = [
    'hellion',
    'highwayman',
    'jester',
    'occultest'
];
let playerImageIdx = 0;

io.on('connection', (socket) => {
    let firstConnection = useAdmin && userConnections.length == 0;
    const ip = socket.conn.remoteAddress.split(":")[3]; // when behind proxy: socket.handshake.headers['x-forwarded-for']
    let user = userConnections.find(x => x.ipAddress == ip);
    if (!user) {
        // actually a new user connecting for the first time
        user = { id: crypto.randomUUID(), ipAddress: ip, socketIds: [socket.id], imageName: playerImages[playerImageIdx], currentTileRow: 47, currentTileCol: 2, admin: firstConnection, shareVision: true };
        playerImageIdx = (playerImageIdx + 1) % playerImages.length;
        userConnections.push(user);

        if (firstConnection)
        {
            // spawn admin player to admin client
            socket.emit('initialize-player', { userId: user.id, imageName: user.imageName, userTileRow: user.currentTileRow, userTileCol: user.currentTileCol, pov: false, shareVision: user.shareVision, admin: user.admin});
            for(var i of enemies)
            {
                userConnections.push({ id: i.id, ipAddress: ip, socketIds: [socket.id], imageName: i.imageName, currentTileRow: i.currentTileRow, currentTileCol: i.currentTileCol, admin: false, shareVision: false});
            }
        }

        console.log(`A user connected from origin: ${ip} with id: ${socket.id}`);
    } else {
        // open another tab after connecting
        user.socketIds.push(socket.id);
        console.log(`Duplicate connection from user with origin: ${user.ipAddress} with id: ${socket.id}`);
    }

    if (user.socketIds.length == 1 && !user.admin)
    {
        // either an initial connection, or a re-connect after closing all instances/tabs so we want to let everyone know
        socket.broadcast.emit('initialize-player', { userId: user.id, imageName: user.imageName, userTileRow: user.currentTileRow, userTileCol: user.currentTileCol, pov: false, shareVision: true, admin: false});
    }
    
    // initialize existing connections to the newly connected client
    for(let u of userConnections)
    {
        if (u.admin && u.id != user.id) continue;
        if (u.socketIds.length == 0) continue;
        const me = u.id == user.id;
        socket.emit('initialize-player', { userId: u.id, imageName: u.imageName, userTileRow: u.currentTileRow, userTileCol: u.currentTileCol, pov: me, shareVision: u.shareVision, admin: u.admin});
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

    socket.on('click', (clickData) => {
        // clickData needs id so admin can control different enemies
        let target: { id: string, currentTileRow: number, currentTileCol: number } = userConnections.find(x => x.id == clickData.id);

        target.currentTileRow = clickData.path[0].tileRow;
        target.currentTileCol = clickData.path[0].tileCol;

        socket.broadcast.emit('move-player', { id: target.id, path: clickData.path } );
    });

    socket.on('stopped', (clickData) => {
        // clickData needs id so admin can control different enemies
        let target: { id: string, currentTileRow: number, currentTileCol: number } = userConnections.find(x => x.id == clickData.id);

        target.currentTileRow = clickData.tileRow;
        target.currentTileCol = clickData.tileCol;

        console.log(`User stopped at r:${clickData.tileRow} c:${clickData.tileCol} from origin: ${ip} with id: ${socket.id}`);
        socket.broadcast.emit('stop-player', target.id);
    });

    socket.on('admin-paint', (paintData) => {
        socket.broadcast.emit('on-admin-paint', paintData);
    });

    socket.on('despawn-player', (id) => {
        let idx = userConnections.findIndex(x => x.id == id);
        if (idx != -1)
        {
            userConnections.splice(idx, 1);
        }
        socket.broadcast.emit('on-despawn-player', id);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on ${networkIpAddress}:${PORT}`);
});