import { Observable, Subject } from "rxjs";
import { DrawContext } from "../graphics/drawContext";
import { Level } from "../level/level";
import { PathfindingNode } from "../level/pathfindingNode";
import { Keyboard } from "./keyboard";
import { Camera } from "../entity/camera";

export class Mouse {

    private mouseClickSubject: Subject<MouseEvent>;
    $mouseClick: Observable<MouseEvent>;

    keyboard: Keyboard;
    camera: Camera;

    #x: number = 0;
    #y: number = 0;

    tileX: number = 0;
    tileY: number = 0;
    mousePath: PathfindingNode[];

    mouseWheelSensitivity = 0.0003;

    constructor(keyboard: Keyboard, camera: Camera) {
        this.keyboard = keyboard;
        this.camera = camera;
        this.mouseClickSubject = new Subject<MouseEvent>();
        this.$mouseClick = this.mouseClickSubject.asObservable();
    }

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

    public render(drawCtx: DrawContext) {
        if (this.keyboard.shift)
            drawCtx.drawPath(this.mousePath);
    }

    public onMouseMove(e: MouseEvent, level: Level) {
        this.x = e.clientX;
        this.y = e.clientY;
        level.needsRedraw = true;
        level.recalculateMousePath = true;
    }

    public onMouseWheel(e: WheelEvent, drawContext: DrawContext, level: Level) {
        const scrollChange = e.deltaY * this.mouseWheelSensitivity;
        drawContext.mouseWheelScroll(scrollChange, e.clientX, e.clientY);
        this.camera.setCameraPosition(drawContext.transformX, drawContext.transformY);
        level.needsRedraw = true;
    }

    public onMouseClick(e: MouseEvent) {
        this.mouseClickSubject.next(e);
    }
}