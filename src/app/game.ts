import { DrawContext } from './graphics/DrawContext';
import { Mouse } from './input/mouse';
import { Level } from './level/level';
import { Keyboard } from './input/keyboard';
import { Camera } from './entity/camera';
import { Player } from './entity/player';

import levelImage from '../assets/maps/test.png';
import playerImage from '../assets/tokens/Wilbur.png';
import { Tile } from './level/tile/tile';

export class Game {
    running: boolean = false;
    #width: number;
    #height: number;
    screen: DrawContext;
    level: Level;
    keyboard: Keyboard;
    mouse: Mouse;
    camera: Camera;

    public set width(newVal: number) {
        this.#width = newVal;
        this.screen!.width = newVal;
    }

    public set height(newVal: number) {
        this.#height = newVal;
        this.screen!.height = newVal;
    }

    constructor(canvas: HTMLCanvasElement) {
        var ctx = canvas.getContext('2d');
        if (ctx == null) throw new DOMException('Could not get rendering context');
        
        this.screen = new DrawContext(ctx, canvas.width, canvas.height);
        this.screen.updateTransform(0, 0);
        this.width = canvas.width;
        this.height = canvas.height;
        this.mouse = new Mouse();
        this.keyboard = new Keyboard();
        this.camera = new Camera(this.keyboard, this.screen);
        this.level = new Level(levelImage, this.camera, this.mouse);
        this.level.addDrawable(new Player(3 * Tile.TileSize, 3 * Tile.TileSize, playerImage));
        document.addEventListener('mousemove', (e) => this.mouse.onMouseMove(e));
        document.addEventListener('wheel', (e) => this.mouse.onMouseWheel(e, this.screen));
        document.addEventListener('keydown', (e) => this.keyboard.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.keyboard.onKeyUp(e));
    }

    update(delta: number): void {
        this.level.update(delta);
    }

    render(): void {
        this.screen.clear();
        this.level.render(this.screen);
    }

    start(): void {
        this.running = true;
    }
}