import { DrawContext } from './graphics/drawContext';
import { Mouse } from './input/mouse';
import { Level } from './level/level';
import { Keyboard } from './input/keyboard';
import { Camera } from './entity/camera';
import { Player } from './entity/player';
import levelImage from '../assets/maps/ruins.png';

import { Socket } from 'socket.io-client';
import { PaintColor } from './graphics/paintColor';
import { ImageBank } from './graphics/imageBank';

export class Game {
    socket: Socket;

    running: boolean = false;
    drawCtx: DrawContext;
    level: Level;
    keyboard: Keyboard;
    mouse: Mouse;
    camera: Camera;

    admin: boolean = false;
    adminCurrentColorIdx: number = 0;
    adminPaintColors = [ PaintColor.Clear, 
                         PaintColor.Black, 
                         PaintColor.Trap, 
                         PaintColor.Curio, 
                         PaintColor.Red, 
                         PaintColor.Yellow,
                         PaintColor.Brown,
                         PaintColor.FakeWall
                        ];

    adminCurrentNpcSpawnIdx: number = 0;
    adminSpawnableNpcs = [
        'slime',
        'large_slime',
        'bone_soldier',
        'collected_rogue',
        'collected_cleric',
        'collected_warrior'
    ];

    public set width(newVal: number) {
        this.drawCtx.width = newVal;
    }

    public set height(newVal: number) {
        this.drawCtx.height = newVal;
    }

    constructor(canvas: HTMLCanvasElement, socket: Socket) {
        var ctx = canvas.getContext('2d');
        if (ctx == null) throw new DOMException('Could not get rendering context');
        
        this.drawCtx = new DrawContext(ctx, canvas.width, canvas.height);
        this.drawCtx.updateTransform(0, 0);
        this.width = canvas.width;
        this.height = canvas.height;
        this.keyboard = new Keyboard();
        this.camera = new Camera(this.keyboard, this.drawCtx);
        this.mouse = new Mouse(this.keyboard);
        this.level = new Level(levelImage, this.mouse, socket);
        this.socket = socket;

        document.addEventListener('mousemove', (e) => this.mouse.onMouseMove(e, this.level, this.drawCtx, this.camera));
        document.addEventListener('wheel', (e) => this.mouse.onMouseWheel(e, this.drawCtx, this.level, this.camera));
        document.addEventListener('keydown', (e) => this.keyboard.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.keyboard.onKeyUp(e));
        document.addEventListener('mousedown', (e) => this.mouse.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.mouse.onMouseUp(e));

        document.addEventListener('touchstart', (e) => this.mouse.onTouchStart(e));
        document.addEventListener('touchend', (e) => this.mouse.onTouchEnd(e));
        document.addEventListener('touchmove', (e) => this.mouse.onTouchMove(e, this.level, this.drawCtx, this.camera));

        this.registerSocketListeningEvents();
    }

    update(delta: number): void {
        this.level.update(delta);
        this.camera.update(delta, this.level);

        if (this.admin)
        {
            this.handleAminControls();
        }
    }

    render(): void {
        this.level.render(this.drawCtx);
    }

    start(): void {
        this.running = true;
    }

    adminCyclePov(): void {
        let npcs = this.level.entities.filter(x => x instanceof Player && !x.shareVision) as Player[];
        if (npcs.length == 0) return;

        let idx = npcs.findIndex(x => x.pov);
        if (idx != -1)
        {
            npcs[idx].pov = false;
        }
        idx = npcs.findIndex(x => x.tileCol == this.mouse.tileCol && x.tileRow == this.mouse.tileRow);
        if (idx != -1)
        {
            npcs[idx].pov = true;
        }

        this.level.recalculateMousePath = true;
        this.level.needsRedraw = true;
    }

    adminCycleNpcs(): void {
        this.adminCurrentNpcSpawnIdx++;
        this.adminCurrentNpcSpawnIdx %= this.adminSpawnableNpcs.length;

        for (let i = 0; i < this.adminSpawnableNpcs.length; i++) {
            let b = document.getElementById(`btn_adminNpc_${this.adminSpawnableNpcs[i]}`);
            b.style.borderColor = this.adminCurrentNpcSpawnIdx == i ? 'green' : 'black';
        }
    }

    adminCycleColor(): void {
        this.adminCurrentColorIdx = (this.adminCurrentColorIdx + 1) % this.adminPaintColors.length;
        for (let c = 0; c < this.adminPaintColors.length; c++) {
            let b = document.getElementById(`btn_adminColor_${this.adminPaintColors[c].name}`);
            b.style.borderColor = this.adminCurrentColorIdx == c ? 'green' : 'black';
        }
    }

    adminPlaceColor(): void {
        let tile = this.level.getTile(this.mouse.tileRow, this.mouse.tileCol);
        if (tile)
        {
            this.level.paintTile(tile, this.adminPaintColors[this.adminCurrentColorIdx].hex);
            this.level.needsRedraw = true;
            this.socket.emit('admin-paint', { row: this.mouse.tileRow, col: this.mouse.tileCol, colorHex: this.adminPaintColors[this.adminCurrentColorIdx].hex });
        }
    }

    adminRemovePlayer(): void {
        let pov = this.level.entities.find(x => x instanceof Player && x.pov);
        if (pov)
        {
            this.socket.emit('despawn-player', pov.id);
            this.level.removeEntityById(pov.id);
            this.level.needsRedraw = true;
            this.level.recalculateMousePath = true;
        }
    }

    adminPlaceNpc(): void {
        let spawnData = { userId: uuid(), tileRow: this.mouse.tileRow, tileCol: this.mouse.tileCol, imageName: this.adminSpawnableNpcs[this.adminCurrentNpcSpawnIdx]};
        this.spawnPlayer(false, spawnData.userId, spawnData.tileRow, spawnData.tileCol, spawnData.imageName, false, false);
        this.socket.emit('admin-spawn', spawnData);
    }

    registerSocketListeningEvents(): void {
        this.socket.on('connect', () => {
            if (this.level.loaded) {
                this.socket.emit('create-game-state', { rows: this.level.height, cols: this.level.width });
            }
        });

        this.socket.on('initialize-player', (message: any) => {
            this.spawnPlayer(message.admin, 
                             message.userId, 
                             message.userTileRow, 
                             message.userTileCol, 
                             message.imageName, 
                             message.pov, 
                             message.shareVision);
        });

        this.socket.on('disconnect-player', (playerId: string) => {
            this.level.removeEntityById(playerId);
            this.level.needsRedraw = true;
            this.level.recalculateVision = true;
        });

        this.socket.on('move-player', (data) => {
            let player = this.level.entities.find(x => x.id == data.id) as Player;
            if (!player) return;

            player.currentMovePath = data.path;
        });

        this.socket.on('stop-player', (userId: string) => {
            let player = this.level.entities.find(x => x.id == userId) as Player;
            if (!player) return;

            player.stopPathMovement();
        });

        this.socket.on('admin-paint', (paintData) => {
            this.level.paintTile(this.level.getTile(paintData.row, paintData.col), paintData.colorHex);
            this.level.recalculateVision = true;
            this.level.needsRedraw = true;
        });

        this.socket.on('despawn-player', (id) => {
            this.level.removeEntityById(id);
            this.level.needsRedraw = true;
            this.level.recalculateVision = true;
        });

        this.socket.on('receive-game-state', (gameState) => {
            if (this.level.loaded)
            {
                for(let r = 0; r < this.level.height; r++) {
                    for(let c = 0; c < this.level.width; c++) {
                        let serverTile = gameState.tiles[r][c];
                        let localTile = this.level.getTile(r, c);
                        this.level.paintTile(localTile, serverTile.paintOverColorHex);
                        localTile.explored = serverTile.explored;
                    }
                }
                let pov = this.level.getPov();
                if (pov)
                {
                    pov.calculateVision(this.level.tileMap);
                }
            }
        });
    }

    handleAminControls(): void {
        if (this.keyboard.toggleLights && !this.level.DEBUG_USE_BRIGHTNESS)
        {
            this.level.DEBUG_USE_BRIGHTNESS = true;
            this.level.needsRedraw = true;
        }
        else if (!this.keyboard.toggleLights && this.level.DEBUG_USE_BRIGHTNESS)
        {
            this.level.DEBUG_USE_BRIGHTNESS = false;
            this.level.needsRedraw = true;
        }

        if (this.keyboard.cyclePov && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminCyclePov();
        }

        if (this.keyboard.cycleColor && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminCycleColor();
        }

        if (this.keyboard.placeColor && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminPlaceColor();
        }

        if (this.keyboard.removePlayer && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminRemovePlayer();
        }

        if (this.keyboard.cycleNpc && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminCycleNpcs();
        }

        if (this.keyboard.placeNpc && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminPlaceNpc();
        }
    }

    spawnPlayer(admin: boolean, userId: string, tileRow: number, tileCol: number, imageName: string, pov: boolean, shareVision: boolean) {
        this.level.needsRedraw = true;
        if (admin) 
        {
            this.admin = true;
            this.level.admin = true;
            this.level.DEBUG_USE_BRIGHTNESS = false;

            this.createAdminControls();
            return;
        }

        var player = new Player(userId, tileRow, tileCol, this.keyboard, imageName, pov, shareVision, this.socket);
        this.level.addEntity(player);
        if (pov) {
            this.camera.setCameraPosition((-player.pixelx + window.innerWidth / 2) * this.drawCtx.scale, (-player.pixely + window.innerHeight / 2) * this.drawCtx.scale);
        }
    }

    createAdminControls(): void {
        let adminContainer = document.getElementById('admin-controls');
        adminContainer.appendChild(this.createAdminNpcPanel());
        adminContainer.appendChild(this.createAdminColorPanel());
    }

    createAdminNpcPanel(): HTMLDivElement {
        let npcContainer = document.createElement('div');
        npcContainer.id = 'admin-npcs';
        npcContainer.style.position = 'fixed';
        npcContainer.style.display = 'flex';
        npcContainer.style.bottom = '64px';
        npcContainer.style.left = '16px';
        npcContainer.style.padding = '3px';
        npcContainer.style.backgroundColor = 'lightgrey';
        
        for (let c = 0; c < this.adminSpawnableNpcs.length; c++) {
            let npc = this.adminSpawnableNpcs[c];
            let button = document.createElement('img');
            button.id = `btn_adminNpc_${npc}`;
            button.role = 'button';
            button.src = ImageBank.getImageUrl(npc);
            button.title = npc;
            button.style.border = 'solid 3px';
            button.style.width = '48px';
            button.style.height = '48px'; 
            button.style.margin = '2px';
            button.style.borderRadius = '50%';
            button.style.cursor = 'pointer';
            button.style.userSelect = 'none';
            button.style.borderColor = c == 0 ?  'green' : 'black';

            button.addEventListener('click', e => { 
                for (let i = 0; i < this.adminSpawnableNpcs.length; i++) {
                    let b = document.getElementById(`btn_adminNpc_${this.adminSpawnableNpcs[i]}`);
                    b.style.borderColor = 'black';
                }
                button.style.borderColor = 'green';
                this.adminCurrentNpcSpawnIdx = c;
            });
            npcContainer.appendChild(button);
        }

        return npcContainer;
    }

    createAdminColorPanel(): HTMLDivElement {
        let colorContainer = document.createElement('div');
        colorContainer.id = 'admin-colors';
        colorContainer.style.position = 'fixed';
        colorContainer.style.display = 'flex';
        colorContainer.style.bottom = '16px';
        colorContainer.style.left = '16px';
        colorContainer.style.padding = '3px';
        colorContainer.style.backgroundColor = 'lightgrey';

        for (let c = 0; c < this.adminPaintColors.length; c++) {
            let color = this.adminPaintColors[c];
            let button = document.createElement('div');
            button.id = `btn_adminColor_${color.name}`;
            button.role = 'button';
            button.style.backgroundColor = `#${color.hex}`;
            button.style.border = 'solid 3px';
            button.style.width = '32px';
            button.style.height = '32px';
            button.style.userSelect = 'none';
            button.style.margin = '2px';
            button.style.cursor = 'pointer';
            button.style.borderColor = c == 0 ?  'green' : 'black';

            button.addEventListener('click', e => { 
                for (let i = 0; i < this.adminPaintColors.length; i++) {
                    let b = document.getElementById(`btn_adminColor_${this.adminPaintColors[i].name}`);
                    b.style.borderColor = 'black';
                }
                button.style.borderColor = 'green';
                this.adminCurrentColorIdx = c; 
            });
            colorContainer.appendChild(button);
        }
        return colorContainer;
    }
}

function uuid() {
    return ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, c => (
        parseInt(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (parseInt(c) / 4)))).toString(16)
    );
}