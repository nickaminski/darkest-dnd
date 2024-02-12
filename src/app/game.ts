import { DrawContext } from './graphics/drawContext';
import { Mouse } from './input/mouse';
import { Level } from './level/level';
import { Keyboard } from './input/keyboard';
import { Camera } from './entity/camera';
import { Player } from './entity/player';

import levelImage from '../assets/maps/test.png';
import playerImage from '../assets/tokens/Wilbur.png';
import player2Image from '../assets/tokens/Ancestor.png';
import { Socket } from 'socket.io-client';

export class Game {
    running: boolean = false;
    #width: number;
    #height: number;
    drawCtx: DrawContext;
    level: Level;
    keyboard: Keyboard;
    mouse: Mouse;
    camera: Camera;

    admin: boolean = false;

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
        this.level = new Level(levelImage, this.mouse);

        document.addEventListener('mousemove', (e) => this.mouse.onMouseMove(e, this.level, this.drawCtx));
        document.addEventListener('wheel', (e) => this.mouse.onMouseWheel(e, this.drawCtx, this.level, this.camera));
        document.addEventListener('keydown', (e) => this.keyboard.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.keyboard.onKeyUp(e));
        document.addEventListener('click', (e) => this.mouse.onMouseClick(e));

        this.registerSocketEvents(socket);
    }

    update(delta: number): void {
        this.level.update(delta);
        this.camera.update(delta, this.level);

        if (this.admin)
        {
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
        }
    }

    render(): void {
        this.level.render(this.drawCtx);
    }

    start(): void {
        this.running = true;
    }

    registerSocketEvents(socket: any): void {
        socket.on("initialize-player", (playerId: string, currentTileRow: number, currentTileCol: number, pov: boolean, admin: boolean) => {
            this.level.needsRedraw = true;
            if (admin) 
            {
                this.admin = true;
                this.level.DEBUG_USE_BRIGHTNESS = false;
                return;
            }

            var player = new Player(playerId, currentTileRow, currentTileCol, this.keyboard, player2Image, pov);
            this.level.addEntity(player);
            if (pov) {
                this.camera.setCameraPosition((-player.pixelx + 64 * 3) * this.drawCtx.scale, (-player.pixely + 64 * 10) * this.drawCtx.scale);
            }
        });

        socket.on("remove-player", (playerId: string) => {
            this.level.removeEntityById(playerId);
            this.level.needsRedraw = true;
        });
    }

}