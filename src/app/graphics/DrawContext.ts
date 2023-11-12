import { Tile } from "../level/tile/tile";

export class DrawContext {
    #scale: number = 0.75;
    transformX: number;
    transformY: number;
    #ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    minScale: number = 0.35;
    maxScale: number = 1.75;

    public get scale(): number {
        return this.#scale;
    }

    public set scale(newVal: number) {
        if (newVal < this.minScale) this.#scale = this.minScale;
        else if (newVal > this.maxScale) this.#scale = this.maxScale;
        else {
            this.#scale = newVal;
        }
    }

    public get ctx(): CanvasRenderingContext2D {
        return this.#ctx;
    }

    private set ctx(newVal: CanvasRenderingContext2D) {
        this.#ctx = newVal;
    }

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.height = height;
        this.width = width;
        this.updateScale(this.#scale);
    }

    clear() {
        this.#ctx.save();
        this.#ctx.setTransform(1, 0, 0, 1, 0 ,0);
        this.#ctx.clearRect(0, 0, this.width, this.height);
        this.#ctx.restore();
    }

    updateScale(scale: number) {
        this.scale = scale;
        var t = this.#ctx.getTransform();
        this.#ctx.setTransform(this.scale, 0, 0, this.scale, t.e, t.f);
    }

    updateTransform(tx: number, ty: number) {
        this.transformX = tx;
        this.transformY = ty;
        var t = this.#ctx.getTransform();
        this.#ctx.setTransform(t.a, 0, 0, t.d, tx, ty);
    }

    mouseWheelScroll(scaleChange: number) {
        this.scale -= scaleChange;
        this.updateScale(this.scale);
    }

    drawTile(tilex: number, tiley: number, width: number, height: number, tileHex: string, brightness: number){
        this.ctx.save();
        if (tileHex == '000000ff') {
            this.ctx.fillStyle = `#${tileHex}`;
            this.ctx.fillRect((tilex << Tile.TileSizeShift), (tiley << Tile.TileSizeShift), width, height);
        } else if (tileHex == 'ffffffff') {
            if (brightness <= -1) {
                this.ctx.fillStyle = `#000000ff`;
                this.ctx.fillRect((tilex << Tile.TileSizeShift), (tiley << Tile.TileSizeShift), width, height);
            } else if (brightness <= 0) {
                this.ctx.fillStyle = `#3d3d3dff`;
                this.ctx.fillRect((tilex << Tile.TileSizeShift), (tiley << Tile.TileSizeShift), width, height);
                this.ctx.strokeRect((tilex << Tile.TileSizeShift), (tiley << Tile.TileSizeShift), width, height);
            } else if (brightness <= 0.5) {
                this.ctx.strokeRect((tilex << Tile.TileSizeShift), (tiley << Tile.TileSizeShift), width, height);
                this.ctx.fillStyle = `#757575ff`;
                this.ctx.fillRect((tilex << Tile.TileSizeShift), (tiley << Tile.TileSizeShift), width, height);
            } else {
                this.ctx.strokeRect((tilex << Tile.TileSizeShift), (tiley << Tile.TileSizeShift), width, height);
            } 
        }
        this.ctx.restore();
    }

    drawImage(pixelx: number, pixely: number, image: HTMLImageElement, width: number, height: number) {
        this.ctx.drawImage(image, pixelx, pixely, width, height);
    }
    
}