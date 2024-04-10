import { DrawContext } from "../graphics/drawContext";
import { Keyboard } from "../input/keyboard";
import { Level } from "../level/level";

export class Camera {
    #x: number;
    #y: number;
    speed: number;
    input: Keyboard;
    screen: DrawContext;

    public get x() {
        return this.#x;
    }

    public get y() {
        return this.#y;
    }

    constructor(input: Keyboard, screen: DrawContext) {
        this.input = input;
        this.screen = screen;
        this.speed = 0.5;
        this.#x = 0;
        this.#y = 0;
    }

    update(delta: number, level: Level) {
        let dx = 0;
        let dy = 0;

        if (this.input.moveUp) {
            dy += this.speed * delta * this.screen.scale;
        }
        if (this.input.moveDown) {
            dy -= this.speed * delta * this.screen.scale;
        }
        if (this.input.moveLeft) {
            dx += this.speed * delta * this.screen.scale;
        }
        if (this.input.moveRight) {
            dx -= this.speed * delta * this.screen.scale;
        }

        if (dx != 0 || dy != 0) {
            this.#x += dx;
            this.#y += dy;
            this.screen.updateTransform(this.#x, this.#y);
            level.needsRedraw = true;
        }
    }

    setCameraPosition(x: number, y: number) {
        this.#x = x;
        this.#y = y;
        this.screen.updateTransform(this.#x, this.#y);
    }
}