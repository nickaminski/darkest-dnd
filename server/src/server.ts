// src/server.ts
// npx nodemon --exec "npx tsx watch src/server.ts"
import 'dotenv/config';
import * as http from 'http';
import os from "os";
import { Server } from "socket.io";
import { UserConnection } from './models/userConnection';
import { GameState } from './models/gameState';
import { MapConfig } from './mapConfig';
import { AppConfig } from "./appConfig";

const server = http.createServer();
const PORT = AppConfig.port;
const io = new Server(server, {
    cors: { origin: '*' }
});

var networkInterfaces = os.networkInterfaces();
const networkIpAddress = networkInterfaces['Ethernet'].find((x: any) => x.family == 'IPv4').address;

let userConnections = new Map<string, UserConnection>();

let characterIdx = 0;

let currentConfig = await MapConfig.load(MapConfig.ruinsLv3);
let currentEnemies = currentConfig.enemies;
let characterSpawnData = currentConfig.playerSpawns;

let gameState = new GameState(currentConfig.mapHeight!, currentConfig.mapWidth!);

console.log(AppConfig);

io.on('connection', (socket) => {
    let reconnectToken = socket.handshake.auth.reconnectToken as string;
    const admin = socket.handshake.auth.adminToken === AppConfig.adminPassword;

    if (!reconnectToken) {
        reconnectToken = crypto.randomUUID();
        socket.emit('assign-reconnect-token', reconnectToken);
    }
    
    let user = userConnections.get(reconnectToken);

    if (!user) {
        // actually a new user connecting for the first time
        let spawnData = characterSpawnData[characterIdx];
        let playerId = crypto.randomUUID();
        user = {
            id: playerId,
            socketIds: [socket.id],
            controlableCharacters: []
        };
        if (admin) {
            for (var i of currentEnemies) {
                user.controlableCharacters.push({ id: crypto.randomUUID(), playerId: playerId, tileRow: i.tileRow, tileCol: i.tileCol, imageName: i.imageName, shareVision: false });
            }
        } else {
            user.controlableCharacters.push({ id: crypto.randomUUID(), playerId: playerId, tileRow: spawnData.tileRow, tileCol: spawnData.tileCol, imageName: spawnData.imageName, shareVision: true });
            characterIdx = (characterIdx + 1) % characterSpawnData.length;
        }

        userConnections.set(reconnectToken, user);
        console.log(`A user connected with socket id: ${socket.id}`);
    } else {
        // open another tab after connecting, or re-connect after closing out
        user.socketIds.push(socket.id);
        console.log(`Duplicate connection from user with socket id: ${socket.id}`);
    }

    if (user.socketIds.length == 1) {
        socket.broadcast.emit('initialize-characters', user.controlableCharacters);
    }

    // initialize existing connections to the newly connected client
    for (const [token, user] of userConnections) {
        // only spawn a player's characters if they are currently connected
        if (user.socketIds.length > 0) {
            socket.emit('initialize-characters', user.controlableCharacters);
        }
    }

    socket.emit('initialize-game-state', {
        playerData: { id: user.id, admin: admin },
        mapData: { hexPixels: currentConfig.mapData, rows: currentConfig.mapHeight, cols: currentConfig.mapWidth },
        gameState: gameState
    });

    socket.on('disconnect', () => {
        let idx = user.socketIds.findIndex(x => x == socket.id);
        if (idx != -1) {
            user.socketIds.splice(idx, 1);
        }
        if (user.socketIds.length == 0) {
            // trigger despawn on all clients, but keep info incase of reconnect
            socket.broadcast.emit('disconnect-user', user.id);
            console.log(`User disconnected with socket id: ${socket.id} - remembering ${userConnections.size} connections`);
        }
    });

    socket.on('click', (clickData) => {
        if (clickData.path.length == 0) return;

        // clickData needs ids so players can control different character
        let target = user.controlableCharacters.find(x => x.id == clickData.id);
        if (!target) return;

        target.tileRow = clickData.path[0].tileRow;
        target.tileCol = clickData.path[0].tileCol;

        socket.broadcast.emit('move-character', { id: target.id, path: clickData.path });
    });

    socket.on('stopped', (clickData) => {
        if (!clickData)
            return;

        // clickData needs ids so players can control different character
        let target = user.controlableCharacters.find(x => x.id == clickData.id);
        if (!target)
            return;

        target.tileRow = clickData.tileRow;
        target.tileCol = clickData.tileCol;

        socket.broadcast.emit('stop-character', target.id);
    });

    socket.on('admin-paint', (paintData) => {
        gameState.paintTile(paintData.row, paintData.col, paintData.colorHex);
        socket.broadcast.emit('admin-paint', paintData);
    });

    socket.on('spawn-minion', (spawnData) => {
        if (!admin && user.controlableCharacters.length >= 2) return;

        let spawn = {
            id: crypto.randomUUID(),
            playerId: spawnData.playerId,
            imageName: spawnData.imageName,
            tileRow: admin ? spawnData.tileRow : user.controlableCharacters[0].tileRow,
            tileCol: admin ? spawnData.tileCol : user.controlableCharacters[0].tileCol,
            shareVision: !admin
        };
        user.controlableCharacters.push(spawn);

        // send to all because the spawning client needs the generated id
        io.sockets.emit('initialize-characters', [spawn]);
    });

    socket.on('despawn-character', (idData) => {
        let idx = user.controlableCharacters.findIndex(x => x.id == idData.characterId);
        if (!admin && user.controlableCharacters.length == 1) return;

        if (idx != -1) {
            user.controlableCharacters.splice(idx, 1);
            io.sockets.emit('despawn-character', idData.characterId);
        }
    });

    socket.on('explored-area', (exploreData) => {
        if (gameState) {
            gameState.exploreArea(exploreData.topLeft, exploreData.area);
        }
    });

    socket.on('change-image', (imageData) => {
        if (imageData) {
            if (!imageData.fileType.match(/image\/\w*/)) {
                console.log(`change-image invalid image: ${imageData.fileType}`);
                return;
            }

            let character = user.controlableCharacters.find(x => x.id == imageData.characterId);
            if (!character) return; 
            
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