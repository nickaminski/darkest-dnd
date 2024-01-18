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

    #x: number = 0;
    #y: number = 0;

    tileX: number = 0;
    tileY: number = 0;
    mousePath: PathfindingNode[];

    zoomRatio: number = 0.9;
    mouseWheelSensitivity = 0.0003;

    constructor(keyboard: Keyboard) {
        this.keyboard = keyboard;
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

    public onMouseWheel(e: WheelEvent, drawContext: DrawContext, level: Level, camera: Camera) {
        const scaleChange = e.deltaY * this.mouseWheelSensitivity;
        const t = drawContext.ctx.getTransform();

        const oldScale = t.a;
        const scaleBy = scaleChange > 0 ? this.zoomRatio : 1 / this.zoomRatio;
        const newScale = oldScale * scaleBy;

        if (newScale < 0.25 || newScale > 1.85) return;

        const oldOrigin = { x: t.e, y: t.f };
        const newOrigin = {
            x: e.clientX - (e.clientX - oldOrigin.x) * scaleBy,
            y: e.clientY - (e.clientY - oldOrigin.y) * scaleBy
        };

        drawContext.updateTransform(newOrigin.x, newOrigin.y);
        drawContext.updateScale(newScale);

        camera.setCameraPosition(drawContext.transformX, drawContext.transformY);
        level.needsRedraw = true;
    }

    public onMouseClick(e: MouseEvent) {
        this.mouseClickSubject.next(e);
    }
}