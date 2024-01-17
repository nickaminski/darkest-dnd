import { DrawContext } from './graphics/drawContext';
import { Mouse } from './input/mouse';
import { Level } from './level/level';
import { Keyboard } from './input/keyboard';
import { Camera } from './entity/camera';
import { Player } from './entity/player';

import levelImage from '../assets/maps/test.png';
import playerImage from '../assets/tokens/Wilbur.png';
import player2Image from '../assets/tokens/Ancestor.png';

export class Game {
    running: boolean = false;
    #width: number;
    #height: number;
    drawCtx: DrawContext;
    level: Level;
    keyboard: Keyboard;
    mouse: Mouse;
    camera: Camera;

    public set width(newVal: number) {
        this.#width = newVal;
        this.drawCtx.width = newVal;
    }

    public set height(newVal: number) {
        this.#height = newVal;
        this.drawCtx.height = newVal;
    }

    constructor(canvas: HTMLCanvasElement) {
        var ctx = canvas.getContext('2d');
        if (ctx == null) throw new DOMException('Could not get rendering context');
        
        this.drawCtx = new DrawContext(ctx, canvas.width, canvas.height);
        this.drawCtx.updateTransform(0, 0);
        this.width = canvas.width;
        this.height = canvas.height;
        this.keyboard = new Keyboard();
        this.camera = new Camera(this.keyboard, this.drawCtx);
        this.mouse = new Mouse(this.keyboard, this.camera);
        this.level = new Level(levelImage, this.camera, this.mouse);
        var player = new Player(7, 7, player2Image, true);
        var player2 = new Player(5, 5, playerImage, false);
        this.level.addEntity(player);
        this.level.addEntity(player2);
        document.addEventListener('mousemove', (e) => this.mouse.onMouseMove(e, this.level));
        document.addEventListener('wheel', (e) => this.mouse.onMouseWheel(e, this.drawCtx, this.level));
        document.addEventListener('keydown', (e) => this.keyboard.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.keyboard.onKeyUp(e));
        document.addEventListener('click', (e) => this.mouse.onMouseClick(e));
    }

    update(delta: number): void {
        this.level.update(delta);
    }

    render(): void {
        this.level.render(this.drawCtx);
    }

    start(): void {
        this.running = true;
    }
}