import { DrawContext } from "../graphics/drawContext";
import { Keyboard } from "../input/keyboard";
import { Level } from "../level/level";
import { Character } from "./character";

export class Camera {
    #x: number;
    #y: number;
    speed: number;
    input: Keyboard;
    drawCtx: DrawContext;

    public get x() {
        return this.#x;
    }

    public get y() {
        return this.#y;
    }

    constructor(input: Keyboard, drawCtx: DrawContext) {
        this.input = input;
        this.drawCtx = drawCtx;
        this.speed = 0.5;
        this.#x = 0;
        this.#y = 0;
    }

    update(delta: number, level: Level) {
        let dx = 0;
        let dy = 0;

        if (this.input.moveUp) {
            dy += this.speed * delta * this.drawCtx.scale;
        }
        if (this.input.moveDown) {
            dy -= this.speed * delta * this.drawCtx.scale;
        }
        if (this.input.moveLeft) {
            dx += this.speed * delta * this.drawCtx.scale;
        }
        if (this.input.moveRight) {
            dx -= this.speed * delta * this.drawCtx.scale;
        }

        if (dx != 0 || dy != 0) {
            this.#x += dx;
            this.#y += dy;
            this.drawCtx.updateTransform(this.#x, this.#y);
            level.needsRedraw = true;
        }
    }

    setCameraPosition(x: number, y: number) {
        this.#x = x;
        this.#y = y;
        this.drawCtx.updateTransform(this.#x, this.#y);
    }

    goToCharacter(character: Character) {
        this.setCameraPosition((-character.pixelx + window.innerWidth / 2) * this.drawCtx.scale, (-character.pixely + window.innerHeight / 2) * this.drawCtx.scale);
    }
}