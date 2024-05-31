// src/server.ts
import * as http from 'http';
import { Server } from "socket.io";
import { UserConnection } from './models/userConnection';
import { GameState } from './models/gameState';
import { CharacterState } from './models/characterState';

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

let oldRoadEnemies = [
    { imageName: 'bandit_fuselier', currentTileRow: 6, currentTileCol: 35 },
    { imageName: 'bandit_cutthroat', currentTileRow: 13, currentTileCol: 33 },
    { imageName: 'bandit_bloodletter', currentTileRow: 16, currentTileCol: 61 }
];

let wealdLv2Enemies = [
    { imageName: 'spitter', currentTileRow: 38, currentTileCol: 54 },
    { imageName: 'spitter', currentTileRow: 38, currentTileCol: 54 },
    { imageName: 'webber', currentTileRow: 38, currentTileCol: 54 },
    { imageName: 'webber', currentTileRow: 38, currentTileCol: 54 },
    { imageName: 'fungal_scratcher', currentTileRow: 73, currentTileCol: 42 },
    { imageName: 'fungal_scratcher', currentTileRow: 73, currentTileCol: 42 },
    { imageName: 'fungal_artillery', currentTileRow: 73, currentTileCol: 42 },
    { imageName: 'fungal_artillery', currentTileRow: 73, currentTileCol: 42 },
    { imageName: 'large_slime', currentTileRow: 42, currentTileCol: 144 },
    { imageName: 'crone', currentTileRow: 39, currentTileCol: 138 },
    { imageName: 'abomination', currentTileRow: 47, currentTileCol: 74 }
];

let ruinsLv3Enemies = [
    { imageName: 'cultist_brawler', currentTileRow: 18, currentTileCol: 19 },
    { imageName: 'cultist_brawler', currentTileRow: 18, currentTileCol: 23 },
    { imageName: 'cultist_acolyte', currentTileRow: 12, currentTileCol: 19 },
    { imageName: 'cultist_acolyte', currentTileRow: 12, currentTileCol: 23 },
    { imageName: 'bone_soldier', currentTileRow: 23, currentTileCol: 42 },
    { imageName: 'bone_defender', currentTileRow: 24, currentTileCol: 42 },
    { imageName: 'bone_arbalist', currentTileRow: 22, currentTileCol: 46 },
    { imageName: 'bone_arbalist', currentTileRow: 26, currentTileCol: 46 },
    { imageName: 'bone_courtier', currentTileRow: 29, currentTileCol: 43 },
    { imageName: 'madman', currentTileRow: 51, currentTileCol: 7 },
    { imageName: 'madman', currentTileRow: 55, currentTileCol: 7 },
    { imageName: 'goul', currentTileRow: 55, currentTileCol: 30 },
    { imageName: 'bone_rabble', currentTileRow: 54, currentTileCol: 29 },
    { imageName: 'bone_rabble', currentTileRow: 52, currentTileCol: 28 },
    { imageName: 'bone_rabble', currentTileRow: 58, currentTileCol: 27 }
];

let ruinsLv4Enemies = [
    { imageName: 'gargoyle', currentTileRow: 14, currentTileCol: 64 },
    { imageName: 'gargoyle', currentTileRow: 14, currentTileCol: 61 },
    { imageName: 'gargoyle', currentTileRow: 17, currentTileCol: 64 },
    { imageName: 'gargoyle', currentTileRow: 17, currentTileCol: 61 },
    { imageName: 'gargoyle', currentTileRow: 19, currentTileCol: 51 },
    { imageName: 'gargoyle', currentTileRow: 24, currentTileCol: 51 },
    { imageName: 'gargoyle', currentTileRow: 24, currentTileCol: 54 },
    { imageName: 'gargoyle', currentTileRow: 24, currentTileCol: 57 },
    { imageName: 'gargoyle', currentTileRow: 19, currentTileCol: 54 },
    { imageName: 'collector', currentTileRow: 11, currentTileCol: 14 },
    { imageName: 'prophet', currentTileRow: 41, currentTileCol: 28 },
    { imageName: 'madman', currentTileRow: 37, currentTileCol: 33 },
    { imageName: 'madman', currentTileRow: 40, currentTileCol: 30 },
    { imageName: 'cultist_acolyte', currentTileRow: 44, currentTileCol: 24 },
    { imageName: 'cultist_acolyte', currentTileRow: 39, currentTileCol: 22 }
];

let oldRoadPlayerSpawn = [
    { imageName: 'highwayman', tileRow: 4, tileCol: 2, shareVision: true },
    { imageName: 'hellion', tileRow: 2, tileCol: 2, shareVision: true },
    { imageName: 'jester', tileRow: 2, tileCol: 4, shareVision: true },
    { imageName: 'occultist', tileRow: 4, tileCol: 4, shareVision: true }
];
let wealdPlayerSpawn  = [
    { imageName: 'highwayman', tileRow: 48, tileCol: 2, shareVision: true },
    { imageName: 'hellion', tileRow: 50, tileCol: 2, shareVision: true },
    { imageName: 'jester', tileRow: 50, tileCol: 4, shareVision: true },
    { imageName: 'occultist', tileRow: 48, tileCol: 4, shareVision: true }
];

let ruins1PlayerSpawn: any[] = [
    { imageName: 'highwayman', tileRow: 1, tileCol: 9, shareVision: true },
    { imageName: 'hellion', tileRow: 1, tileCol: 10, shareVision: true },
    { imageName: 'jester', tileRow: 2, tileCol: 10, shareVision: true },
    { imageName: 'occultist', tileRow: 2, tileCol: 10, shareVision: true }
];

let ruins2PlayerSpawn: any[] = [
    { imageName: 'highwayman', tileRow: 1, tileCol: 61, shareVision: true },
    { imageName: 'hellion', tileRow: 2, tileCol: 61, shareVision: true },
    { imageName: 'jester', tileRow: 3, tileCol: 61, shareVision: true },
    { imageName: 'occultist', tileRow: 4, tileCol: 61, shareVision: true }
];

let currentEnemies = wealdLv2Enemies;
let characterSpawnData = wealdPlayerSpawn;

let characterIdx = 0;

let gameState: GameState;

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
                user.controlableCharacters.push({ 
                    id: crypto.randomUUID(),
                    playerId: playerId,
                    imageName: i.imageName,
                    tileRow: i.currentTileRow, 
                    tileCol: i.currentTileCol, 
                    shareVision: false
                });
            }
        } else {
            user.controlableCharacters.push({
                id: crypto.randomUUID(),
                playerId: playerId,
                tileRow: spawnData.tileRow,
                tileCol: spawnData.tileCol,
                imageName: spawnData.imageName,
                imageFile: null,
                shareVision: !adminConnection
            });
        }
        characterIdx = (characterIdx + 1) % characterSpawnData.length;

        userConnections.push(user);
        console.log(`A user connected from origin: ${ip} with id: ${socket.id}`);
    } else {
        // open another tab after connecting, or re-connect after closing out
        user.socketIds.push(socket.id);
        console.log(`Duplicate connection from user with origin: ${user.ipAddress} with id: ${socket.id}`);
    }
    socket.emit('assign-player-data', {id: user.id, admin: adminConnection});

    if (user.socketIds.length == 1) {
        socket.broadcast.emit('initialize-characters', user.controlableCharacters);
    }

    // initialize existing connections to the newly connected client
    for(let u of userConnections)
    {
        if (u.socketIds.length > 0)
            socket.emit('initialize-characters', u.controlableCharacters);
    }

    if (gameState)
    {
        socket.emit('receive-game-state', gameState);
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

    socket.on('create-game-state', (initData) => {
        if (!gameState)
        {
            gameState = new GameState(initData.rows, initData.cols);
        }
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