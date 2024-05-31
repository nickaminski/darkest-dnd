import { Observable, Subject } from "rxjs";
import { DrawContext } from "../graphics/drawContext";
import { Level } from "../level/level";
import { PathfindingNode } from "../level/pathfindingNode";
import { Keyboard } from "./keyboard";
import { Camera } from "../entity/camera";
import { Tile } from "../level/tile/tile";

export class Mouse {

    private mouseClickSubject: Subject<MouseEvent>;
    $mouseClick: Observable<MouseEvent>;

    mouseDown: boolean;
    mouseDragging: boolean;

    keyboard: Keyboard;

    #x: number = 0;
    #y: number = 0;

    tileCol: number = 0;
    tileRow: number = 0;
    mousePath: PathfindingNode[];

    zoomRatio: number = 0.9;
    mouseWheelSensitivity = 0.0003;

    lastDragPos: any;

    constructor(keyboard: Keyboard) {
        this.keyboard = keyboard;
        this.mouseClickSubject = new Subject<MouseEvent>();
        this.$mouseClick = this.mouseClickSubject.asObservable();
        this.mouseDown = false;
        this.mouseDragging = false;
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
        if (this.keyboard.drawPath)
            drawCtx.drawPath(this.mousePath);
    }

    public onMouseMove(e: MouseEvent, level: Level, drawContext: DrawContext, camera: Camera) {
        const oldX = this.tileCol;
        const oldY = this.tileRow;
        this.x = e.clientX;
        this.y = e.clientY;
        this.tileCol = ((this.x - drawContext.transformX) / drawContext.scale) >> Tile.TileSizeShift;
        this.tileRow = ((this.y - drawContext.transformY) / drawContext.scale) >> Tile.TileSizeShift;
        level.needsRedraw = true;
        if (oldX != this.tileCol || oldY != this.tileRow) {
            level.recalculateMousePath = true;
        }
        
        if (this.mouseDown) {
            this.mouseDragging = true;
        }

        if (this.mouseDragging) {
            camera.setCameraPosition(e.clientX - this.lastDragPos.x + camera.x , e.clientY - this.lastDragPos.y + camera.y);
            this.lastDragPos = { x: e.clientX, y: e.clientY };
        }
    }

    public onMouseWheel(e: WheelEvent, drawContext: DrawContext, level: Level, camera: Camera) {
        const scaleChange = e.deltaY * this.mouseWheelSensitivity;
        const t = drawContext.ctx.getTransform();

        const oldScale = t.a;
        const scaleBy = scaleChange > 0 ? this.zoomRatio : 1 / this.zoomRatio;
        const newScale = oldScale * scaleBy;

        if (newScale < drawContext.minScale || newScale > drawContext.maxScale) return;

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

    public onMouseDown(e: MouseEvent) {
        this.mouseDown = true;
        this.lastDragPos = { x: e.clientX, y: e.clientY };
    }

    public onTouchStart(e: TouchEvent) {
        this.mouseDown = true;
        this.lastDragPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    public onMouseUp(e: MouseEvent) {
        if (!this.mouseDragging) {
            this.mouseClickSubject.next(e);
        }
        this.mouseDown = false;
        this.mouseDragging = false;
    }

    public onTouchEnd(e: TouchEvent) {
        this.mouseDown = false;
        this.mouseDragging = false;
    }

    public onTouchMove(e: TouchEvent, level: Level, drawContext: DrawContext, camera: Camera) {
        const oldX = this.tileCol;
        const oldY = this.tileRow;
        this.x = e.touches[0].clientX;
        this.y = e.touches[0].clientY;
        this.tileCol = ((this.x - drawContext.transformX) / drawContext.scale) >> Tile.TileSizeShift;
        this.tileRow = ((this.y - drawContext.transformY) / drawContext.scale) >> Tile.TileSizeShift;
        level.needsRedraw = true;
        if (oldX != this.tileCol || oldY != this.tileRow) {
            level.recalculateMousePath = true;
        }

        if (this.mouseDown) {
            this.mouseDragging = true;
        }

        if (this.mouseDragging) {
            camera.setCameraPosition(e.touches[0].clientX - this.lastDragPos.x + camera.x , e.touches[0].clientY - this.lastDragPos.y + camera.y);
            this.lastDragPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }
}