// src/server.ts
import * as http from 'http';
import { Server } from "socket.io";
import { UserConnection } from './models/userConnection';
import { SpawnData } from './models/spawnData';
import { first } from 'rxjs';
import { GameState } from './models/gameState';

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
    { id: crypto.randomUUID(), imageName: 'bandit_fuselier', currentTileRow: 6, currentTileCol: 35 },
    { id: crypto.randomUUID(), imageName: 'bandit_cutthroat', currentTileRow: 13, currentTileCol: 33 },
    { id: crypto.randomUUID(), imageName: 'bandit_bloodletter', currentTileRow: 16, currentTileCol: 61 }
];

let wealdLv2Enemies = [
    { id: crypto.randomUUID(), imageName: 'spitter', currentTileRow: 38, currentTileCol: 54 },
    { id: crypto.randomUUID(), imageName: 'spitter', currentTileRow: 38, currentTileCol: 54 },
    { id: crypto.randomUUID(), imageName: 'webber', currentTileRow: 38, currentTileCol: 54 },
    { id: crypto.randomUUID(), imageName: 'webber', currentTileRow: 38, currentTileCol: 54 },
    { id: crypto.randomUUID(), imageName: 'fungal_scratcher', currentTileRow: 73, currentTileCol: 42 },
    { id: crypto.randomUUID(), imageName: 'fungal_scratcher', currentTileRow: 73, currentTileCol: 42 },
    { id: crypto.randomUUID(), imageName: 'fungal_artillery', currentTileRow: 73, currentTileCol: 42 },
    { id: crypto.randomUUID(), imageName: 'fungal_artillery', currentTileRow: 73, currentTileCol: 42 },
    { id: crypto.randomUUID(), imageName: 'large_slime', currentTileRow: 42, currentTileCol: 144 },
    { id: crypto.randomUUID(), imageName: 'slime', currentTileRow: 39, currentTileCol: 138 },
    { id: crypto.randomUUID(), imageName: 'abomination', currentTileRow: 47, currentTileCol: 74 }
];

let ruinsLv3Enemies = [
    { id: crypto.randomUUID(), imageName: 'cultist_brawler', currentTileRow: 18, currentTileCol: 19 },
    { id: crypto.randomUUID(), imageName: 'cultist_brawler', currentTileRow: 18, currentTileCol: 23 },
    { id: crypto.randomUUID(), imageName: 'cultist_acolyte', currentTileRow: 12, currentTileCol: 19 },
    { id: crypto.randomUUID(), imageName: 'cultist_acolyte', currentTileRow: 12, currentTileCol: 23 },
    { id: crypto.randomUUID(), imageName: 'bone_soldier', currentTileRow: 23, currentTileCol: 42 },
    { id: crypto.randomUUID(), imageName: 'bone_defender', currentTileRow: 24, currentTileCol: 42 },
    { id: crypto.randomUUID(), imageName: 'bone_arbalist', currentTileRow: 22, currentTileCol: 46 },
    { id: crypto.randomUUID(), imageName: 'bone_arbalist', currentTileRow: 26, currentTileCol: 46 },
    { id: crypto.randomUUID(), imageName: 'bone_courtier', currentTileRow: 29, currentTileCol: 43 },
    { id: crypto.randomUUID(), imageName: 'madman', currentTileRow: 51, currentTileCol: 7 },
    { id: crypto.randomUUID(), imageName: 'madman', currentTileRow: 55, currentTileCol: 7 },
    { id: crypto.randomUUID(), imageName: 'goul', currentTileRow: 55, currentTileCol: 30 },
    { id: crypto.randomUUID(), imageName: 'bone_rabble', currentTileRow: 54, currentTileCol: 29 },
    { id: crypto.randomUUID(), imageName: 'bone_rabble', currentTileRow: 52, currentTileCol: 28 },
    { id: crypto.randomUUID(), imageName: 'bone_rabble', currentTileRow: 58, currentTileCol: 27 }
];

let ruinsLv4Enemies = [
    { id: crypto.randomUUID(), imageName: 'gargoyle', currentTileRow: 14, currentTileCol: 64 },
    { id: crypto.randomUUID(), imageName: 'gargoyle', currentTileRow: 14, currentTileCol: 61 },
    { id: crypto.randomUUID(), imageName: 'gargoyle', currentTileRow: 17, currentTileCol: 64 },
    { id: crypto.randomUUID(), imageName: 'gargoyle', currentTileRow: 17, currentTileCol: 61 },
    { id: crypto.randomUUID(), imageName: 'gargoyle', currentTileRow: 19, currentTileCol: 51 },
    { id: crypto.randomUUID(), imageName: 'gargoyle', currentTileRow: 24, currentTileCol: 51 },
    { id: crypto.randomUUID(), imageName: 'gargoyle', currentTileRow: 24, currentTileCol: 54 },
    { id: crypto.randomUUID(), imageName: 'gargoyle', currentTileRow: 24, currentTileCol: 57 },
    { id: crypto.randomUUID(), imageName: 'gargoyle', currentTileRow: 19, currentTileCol: 54 },
    { id: crypto.randomUUID(), imageName: 'collector', currentTileRow: 11, currentTileCol: 14 },
    { id: crypto.randomUUID(), imageName: 'prophet', currentTileRow: 41, currentTileCol: 28 },
    { id: crypto.randomUUID(), imageName: 'madman', currentTileRow: 37, currentTileCol: 33 },
    { id: crypto.randomUUID(), imageName: 'madman', currentTileRow: 40, currentTileCol: 30 },
    { id: crypto.randomUUID(), imageName: 'cultist_acolyte', currentTileRow: 44, currentTileCol: 24 },
    { id: crypto.randomUUID(), imageName: 'cultist_acolyte', currentTileRow: 39, currentTileCol: 22 }
];

let oldRoadPlayerSpawn: SpawnData[] = [
    { imageName: 'highwayman', tileRow: 4, tileCol: 2 },
    { imageName: 'hellion', tileRow: 2, tileCol: 2 },
    { imageName: 'jester', tileRow: 2, tileCol: 4 },
    { imageName: 'occultist', tileRow: 4, tileCol: 4 }
];
let wealdPlayerSpawn: SpawnData[] = [
    { imageName: 'highwayman', tileRow: 48, tileCol: 2 },
    { imageName: 'hellion', tileRow: 50, tileCol: 2 },
    { imageName: 'jester', tileRow: 50, tileCol: 4 },
    { imageName: 'occultist', tileRow: 48, tileCol: 4 }
];

let ruins1PlayerSpawn: SpawnData[] = [
    { imageName: 'highwayman', tileRow: 1, tileCol: 9 },
    { imageName: 'hellion', tileRow: 1, tileCol: 10 },
    { imageName: 'jester', tileRow: 2, tileCol: 10 },
    { imageName: 'occultist', tileRow: 2, tileCol: 10 }
];

let ruins2PlayerSpawn: SpawnData[] = [
    { imageName: 'highwayman', tileRow: 1, tileCol: 61 },
    { imageName: 'hellion', tileRow: 2, tileCol: 61 },
    { imageName: 'jester', tileRow: 3, tileCol: 61 },
    { imageName: 'occultist', tileRow: 4, tileCol: 61 }
];

let currentEnemies = ruinsLv3Enemies;
let playerSpawnData = ruins1PlayerSpawn;

let playerIdx = 0;

let gameState: GameState;

io.on('connection', (socket) => {
    let firstConnection = userConnections.length == 0;
    const ip = socket.conn.remoteAddress.split(":")[3]; // when behind proxy: socket.handshake.headers['x-forwarded-for']
    let adminConnection = ip == networkIpAddress;
    let user = userConnections.find(x => x.ipAddress == ip);
    if (!user) {
        // actually a new user connecting for the first time
        let spawnData = playerSpawnData[playerIdx]
        user = { id: crypto.randomUUID(), ipAddress: ip, socketIds: [socket.id], imageName: spawnData.imageName, currentTileRow: spawnData.tileRow, currentTileCol: spawnData.tileCol, admin: adminConnection, shareVision: !adminConnection };
        playerIdx = (playerIdx + 1) % playerSpawnData.length;
        userConnections.push(user);

        if (adminConnection)
        {
            // spawn admin player to admin client
            socket.emit('initialize-player', { userId: user.id, imageName: '', 
                                               userTileRow: user.currentTileRow, 
                                               userTileCol: user.currentTileCol, 
                                               pov: false, 
                                               shareVision: user.shareVision,
                                               admin: user.admin
                                            });
        }

        if (firstConnection)
        {
            for(var i of currentEnemies)
            {
                userConnections.push({ id: i.id, 
                                       ipAddress: ip, 
                                       socketIds: [socket.id], 
                                       imageName: i.imageName, 
                                       currentTileRow: i.currentTileRow, 
                                       currentTileCol: i.currentTileCol, 
                                       shareVision: false,
                                       admin: false
                                    });
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
        socket.broadcast.emit('initialize-player', { userId: user.id, 
                                                     imageName: user.imageName, 
                                                     userTileRow: user.currentTileRow, 
                                                     userTileCol: user.currentTileCol, 
                                                     pov: false, 
                                                     shareVision: true, 
                                                     admin: false
                                                    });
    }
    
    // initialize existing connections to the newly connected client
    for(let u of userConnections)
    {
        if (u.admin && u.id != user.id) continue;
        if (u.socketIds.length == 0) continue;
        const me = u.id == user.id;
        socket.emit('initialize-player', { userId: u.id, imageName: u.imageName, userTileRow: u.currentTileRow, userTileCol: u.currentTileCol, pov: me, shareVision: u.shareVision, admin: u.admin});
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
            socket.broadcast.emit('disconnect-player', user.id);
            console.log(`User disconnected from origin: ${ip} with id: ${socket.id} - remembering ${userConnections.length} connections`);
        }
    });

    socket.on('click', (clickData) => {
        // clickData needs id so admin can control different enemies
        let target: { id: string, currentTileRow: number, currentTileCol: number } = userConnections.find(x => x.id == clickData.id);

        if (clickData.path.length == 0) return;
        
        target.currentTileRow = clickData.path[0].tileRow;
        target.currentTileCol = clickData.path[0].tileCol;

        socket.broadcast.emit('move-player', { id: target.id, path: clickData.path } );
    });

    socket.on('stopped', (clickData) => {
        // clickData needs id so admin can control different enemies
        let target: { id: string, currentTileRow: number, currentTileCol: number } = userConnections.find(x => x.id == clickData.id);

        target.currentTileRow = clickData.tileRow;
        target.currentTileCol = clickData.tileCol;

        socket.broadcast.emit('stop-player', target.id);
    });

    socket.on('create-game-state', (initData) => {
        if (!gameState)
        {
            gameState = new GameState(initData.rows, initData.cols)
        }
    });

    socket.on('admin-paint', (paintData) => {
        gameState.paintTile(paintData.row, paintData.col, paintData.colorHex);
        socket.broadcast.emit('admin-paint', paintData);
    });

    socket.on('admin-spawn', (spawnData) => {
        let spawn = { 
            id: spawnData.userId, 
            ipAddress: ip, 
            socketIds: [socket.id], 
            imageName: spawnData.imageName, 
            currentTileRow: spawnData.tileRow, 
            currentTileCol: spawnData.tileCol, 
            admin: false, 
            shareVision: false 
        };
        userConnections.push(spawn);
        socket.broadcast.emit('initialize-player', { userId: spawn.id, 
                                                     imageName: spawn.imageName, 
                                                     userTileRow: spawn.currentTileRow, 
                                                     userTileCol: spawn.currentTileCol, 
                                                     pov: false, 
                                                     shareVision: false, 
                                                     admin: false
                                                });
    });

    socket.on('despawn-player', (id) => {
        let idx = userConnections.findIndex(x => x.id == id);
        if (idx != -1)
        {
            userConnections.splice(idx, 1);
        }
        socket.broadcast.emit('despawn-player', id);
    });

    socket.on('explored-area', (exploreData) => {
        if (gameState)
        {
            gameState.exploreArea(exploreData.topLeft, exploreData.area);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on ${networkIpAddress}:${PORT}`);
});