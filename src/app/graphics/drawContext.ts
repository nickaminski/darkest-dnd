import { PathfindingNode } from "../level/pathfindingNode";
import { BrightnessLevel } from "../level/tile/brightness";
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
        this.#ctx.fillStyle = 'ffffff';
        this.#ctx.fillRect(0, 0, this.width, this.height);
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

    drawTile(tileRow: number, tileCol: number, width: number, height: number, tileHex: string, brightness: BrightnessLevel){
        this.ctx.save();
        if (brightness != BrightnessLevel.Dark) {
            // screen is cleared with black, so we dont need to draw black squares for darkness
            switch(tileHex)
            {
                case '000000ff': this.ctx.fillStyle = '#333333ff'; break;
                case 'ffffffff': this.ctx.fillStyle = '#ffffffff'; break;
            }
            this.ctx.strokeRect((tileCol << Tile.TileSizeShift), (tileRow << Tile.TileSizeShift), width, height);
            this.ctx.fillRect((tileCol << Tile.TileSizeShift), (tileRow << Tile.TileSizeShift), width, height);

            if (tileHex != '000000ff')
            {
                if (brightness == BrightnessLevel.Explored) {
                    this.ctx.fillStyle = '#000000aa';
                    this.ctx.fillRect((tileCol << Tile.TileSizeShift), (tileRow << Tile.TileSizeShift), width, height);
                } else if (brightness == BrightnessLevel.Dim) {
                    this.ctx.fillStyle = '#00000066';
                    this.ctx.fillRect((tileCol << Tile.TileSizeShift), (tileRow << Tile.TileSizeShift), width, height);
                }
            }
        }
        this.ctx.restore();
    }

    drawImage(pixelx: number, pixely: number, image: HTMLImageElement, width: number, height: number) {
        this.ctx.drawImage(image, pixelx, pixely, width, height);
    }

    drawPath(path: PathfindingNode[]) {
        if (!path || path.length < 2) return;

        this.ctx.save();
        this.ctx.strokeStyle = `#ff00ffff`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        this.ctx.moveTo((path[0].tileCol << Tile.TileSizeShift) + Tile.TileSize / 2, (path[0].tileRow << Tile.TileSizeShift) + Tile.TileSize / 2);
        for(var i = 1; i < path.length; i++)
            this.ctx.lineTo((path[i].tileCol << Tile.TileSizeShift) + Tile.TileSize / 2, (path[i].tileRow << Tile.TileSizeShift) + Tile.TileSize / 2);

        this.ctx.stroke();

        this.ctx.restore();
    }
    
}
