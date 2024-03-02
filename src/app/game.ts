import { DrawContext } from './graphics/drawContext';
import { Mouse } from './input/mouse';
import { Level } from './level/level';
import { Keyboard } from './input/keyboard';
import { Camera } from './entity/camera';
import { Player } from './entity/player';
import levelImage from '../assets/maps/ruins.png';

import { Socket } from 'socket.io-client';

export class Game {
    socket: Socket;

    running: boolean = false;
    #width: number;
    #height: number;
    drawCtx: DrawContext;
    level: Level;
    keyboard: Keyboard;
    mouse: Mouse;
    camera: Camera;

    admin: boolean = false;
    adminCurrentColorIdx: number = 0;
    adminPaintColors = [ { hex: '', name: 'clear' }, 
                         { hex: '000000', name: 'black'}, 
                         { hex: 'a300d5', name: 'trap'}, 
                         { hex: '496bff', name: 'curio' }, 
                         { hex: 'ff0000', name: 'red' }, 
                         { hex: 'ffcc00', name: 'yellow' } ];

    public set width(newVal: number) {
        this.#width = newVal;
        this.drawCtx.width = newVal;
    }

    public set height(newVal: number) {
        this.#height = newVal;
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

        document.addEventListener('mousemove', (e) => this.mouse.onMouseMove(e, this.level, this.drawCtx));
        document.addEventListener('wheel', (e) => this.mouse.onMouseWheel(e, this.drawCtx, this.level, this.camera));
        document.addEventListener('keydown', (e) => this.keyboard.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.keyboard.onKeyUp(e));
        document.addEventListener('click', (e) => this.mouse.onMouseClick(e));

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
        let players = this.level.entities.filter(x => x instanceof Player) as Player[];
        let npcs = players.filter(x => !x.shareVision);
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

    registerSocketListeningEvents(): void {
        this.socket.on('initialize-player', (message: any) => {
            this.level.needsRedraw = true;
            if (message.admin) 
            {
                this.admin = true;
                this.level.admin = true;
                this.level.DEBUG_USE_BRIGHTNESS = false;
                return;
            }

            var player = new Player(message.userId, message.userTileRow, message.userTileCol, this.keyboard, message.imageName, message.pov, message.shareVision, this.socket);
            this.level.addEntity(player);
            if (message.pov) {
                this.camera.setCameraPosition((-player.pixelx + 64 * 3) * this.drawCtx.scale, (-player.pixely + 64 * 10) * this.drawCtx.scale);
            }
        });

        this.socket.on('remove-player', (playerId: string) => {
            this.level.removeEntityById(playerId);
            this.level.needsRedraw = true;
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

        this.socket.on('on-admin-paint', (paintData) => {
            this.level.paintTile(paintData.row, paintData.col, paintData.colorHex);
            this.level.needsRedraw = true;
        });

        this.socket.on('on-despawn-player', (id) => {
            this.level.removeEntityById(id);
            this.level.needsRedraw = true;
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
                this.adminCurrentColorIdx = (this.adminCurrentColorIdx + 1) % this.adminPaintColors.length;
                console.log(`current paint color: ${this.adminPaintColors[this.adminCurrentColorIdx].name}`);
            }

            if (this.keyboard.placeColor && !this.keyboard.didCycle)
            {
                this.level.paintTile(this.mouse.tileRow, this.mouse.tileCol, this.adminPaintColors[this.adminCurrentColorIdx].hex);
                this.level.needsRedraw = true;
                this.socket.emit('admin-paint', { row: this.mouse.tileRow, col: this.mouse.tileCol, colorHex: this.adminPaintColors[this.adminCurrentColorIdx].hex });
            }

            if (this.keyboard.removePlayer && !this.keyboard.didCycle)
            {
                let pov = this.level.entities.find(x => x instanceof Player && x.pov);
                if (pov)
                {
                    this.socket.emit('despawn-player', pov.id);
                    this.level.removeEntityById(pov.id);
                    this.level.needsRedraw = true;
                    this.level.recalculateMousePath = true;
                }
            }
    }

}