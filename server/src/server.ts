// src/server.ts
import * as http from 'http';
import { Server } from "socket.io";
import { UserConnection } from './models/userConnection';
import { GameState } from './models/gameState';
import { MapConfig } from './mapConfig';

const server = http.createServer();
const PORT = process.env.PORT || 3000;
const io = new Server(server, {
    cors: { origin: '*' }
});

let userConnections: UserConnection[] = [];

var os = require('os');
var networkInterfaces = os.networkInterfaces();
const networkIpAddress = networkInterfaces['Wi-Fi 4'].find((x: any) => x.family == 'IPv4').address;
let characterIdx = 0;

let currentConfig = MapConfig.load(MapConfig.wealdLv2);
let currentEnemies = currentConfig.enemies;
let characterSpawnData = currentConfig.playerSpawns;

let gameState = new GameState(currentConfig.mapHeight, currentConfig.mapWidth);

io.on('connection', (socket) => {
    const ip = socket.conn.remoteAddress.split(":")[3]; // when behind proxy: socket.handshake.headers['x-forwarded-for']
    let adminConnection = ip == networkIpAddress;
    let user = userConnections.find(x => x.ipAddress == ip);
    if (!user) {
        // actually a new user connecting for the first time
        let spawnData = characterSpawnData[characterIdx];
        let playerId = crypto.randomUUID();
        user = {
            id: playerId,
            ipAddress: ip,
            socketIds: [socket.id],
            admin: adminConnection,
            controlableCharacters: []
        };
        if (adminConnection) {
            for(var i of currentEnemies)
            {
                user.controlableCharacters.push({ id: crypto.randomUUID(), playerId: playerId, tileRow: i.tileRow, tileCol: i.tileCol, imageName: i.imageName, shareVision: false});
            }
        } else {
            user.controlableCharacters.push({ id: crypto.randomUUID(), playerId: playerId, tileRow: spawnData.tileRow, tileCol: spawnData.tileCol, imageName: spawnData.imageName, shareVision: true});
            characterIdx = (characterIdx + 1) % characterSpawnData.length;
        }

        userConnections.push(user);
        console.log(`A user connected from origin: ${ip} with id: ${socket.id}`);
    } else {
        // open another tab after connecting, or re-connect after closing out
        user.socketIds.push(socket.id);
        console.log(`Duplicate connection from user with origin: ${user.ipAddress} with id: ${socket.id}`);
    }

    if (user.socketIds.length == 1) {
        socket.broadcast.emit('initialize-characters', user.controlableCharacters);
    }
    
    // initialize existing connections to the newly connected client
    for(let u of userConnections)
    {
        // only spawn a player's characters if they are currently connected
        if (u.socketIds.length > 0) {
            socket.emit('initialize-characters', u.controlableCharacters);
        }
    }

    socket.emit('initialize-game-state', {
        playerData: {id: user.id, admin: adminConnection},
        mapData: { buffer: currentConfig.mapData, rows: currentConfig.mapHeight, cols: currentConfig.mapWidth },
        gameState: gameState
    });

    socket.on('disconnect', () => {
        let idx = user.socketIds.findIndex(x => x == socket.id);
        if (idx != -1)
        {
            user.socketIds.splice(idx, 1);
        }   
        if (user.socketIds.length == 0)
        {
            // trigger despawn on all clients, but keep info incase of reconnect
            socket.broadcast.emit('disconnect-user', user.id);
            console.log(`User disconnected from origin: ${ip} with id: ${socket.id} - remembering ${userConnections.length} connections`);
        }
    });

    socket.on('click', (clickData) => {
        if (clickData.path.length == 0) return;

        // clickData needs ids so players can control different character
        let target = userConnections.flatMap(x => x.controlableCharacters).find(x => x.id == clickData.id);

        if (!target) return;

        target.tileRow = clickData.path[0].tileRow;
        target.tileCol = clickData.path[0].tileCol;

        socket.broadcast.emit('move-character', { id: target.id, path: clickData.path } );
    });

    socket.on('stopped', (clickData) => {
        // clickData needs ids so players can control different character
        let target: { id: string, tileRow: number, tileCol: number } = userConnections.flatMap(x => x.controlableCharacters).find(x => x.id == clickData.id);

        target.tileRow = clickData.tileRow;
        target.tileCol = clickData.tileCol;

        socket.broadcast.emit('stop-character', target.id);
    });

    socket.on('admin-paint', (paintData) => {
        gameState.paintTile(paintData.row, paintData.col, paintData.colorHex);
        socket.broadcast.emit('admin-paint', paintData);
    });

    socket.on('admin-spawn', (spawnData) => {
        let spawn = { 
            id: crypto.randomUUID(),
            playerId: spawnData.playerId,
            imageName: spawnData.imageName,
            tileRow: spawnData.tileRow, 
            tileCol: spawnData.tileCol,
            shareVision: false 
        };
        userConnections.find(x => x.id == spawnData.playerId).controlableCharacters.push(spawn);

        // send to all because the spawning client needs the generated id
        io.sockets.emit('initialize-characters', [spawn]);
    });

    socket.on('despawn-character', (idData) => {
        let idx = userConnections.find(x => x.id == idData.playerId).controlableCharacters.findIndex(x => x.id == idData.characterId);
        if (idx != -1)
        {
            userConnections.find(x => x.id == idData.playerId).controlableCharacters.splice(idx, 1);
            socket.broadcast.emit('despawn-character', idData.characterId);
        }
    });

    socket.on('explored-area', (exploreData) => {
        if (gameState)
        {
            gameState.exploreArea(exploreData.topLeft, exploreData.area);
        }
    });

    socket.on('change-image', (imageData) => {
        if (imageData) {
            let character = user.controlableCharacters.find(x => x.id == imageData.characterId);
            character.imageName = imageData.name;
            character.imageFile = imageData.file;
            socket.broadcast.emit('change-image', imageData);
        }
    });

    socket.on('admin-freeze-all', () => {
        gameState.freezeCharacterMovement = !gameState.freezeCharacterMovement;
        socket.broadcast.emit('freeze');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on ${networkIpAddress}:${PORT}`);
});