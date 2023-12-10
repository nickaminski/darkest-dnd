import { DrawContext } from "../graphics/drawContext";
import { Level } from "../level/level";

export class Mouse {
    #x: number = 0;
    #y: number = 0;

    mouseWheelSensitivity = 0.001;

    public get x(): number {
        return this.#x;
    }

    private set x(newVal: number) {
        this.#x = newVal;
    }

    public get y(): number {
        return this.#y;
    }

    private set y(newVal: number) {
        this.#y = newVal;
    }

    public onMouseMove(e: MouseEvent, level: Level) {
        this.x = e.clientX;
        this.y = e.clientY;
        level.needsRedraw = true;
    }

    public onMouseWheel(e: WheelEvent, drawContext: DrawContext, level: Level) {
        const scrollChange = e.deltaY * this.mouseWheelSensitivity;
        drawContext.mouseWheelScroll(scrollChange);
        level.needsRedraw = true;
    }
}