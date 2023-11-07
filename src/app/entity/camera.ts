import { DrawContext } from "../graphics/DrawContext";
import { Keyboard } from "../input/keyboard";

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

    update(delta: number) {
        if (this.input.moveUp) {
            this.#y += this.speed * delta;
            this.screen.updateTransform(this.#x, this.#y);
        }
        if (this.input.moveDown) {
            this.#y -= this.speed * delta;
            this.screen.updateTransform(this.#x, this.#y);
        }
        if (this.input.moveLeft) {
            this.#x += this.speed * delta;
            this.screen.updateTransform(this.#x, this.#y);
        }
        if (this.input.moveRight) {
            this.#x -= this.speed * delta;
            this.screen.updateTransform(this.#x, this.#y);
        }
    }

    setCameraPosition(x: number, y: number) {
        this.#x = x;
        this.#y = y;
    }
}