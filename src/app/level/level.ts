import { Camera } from "../entity/camera";
import { Drawable } from "../entity/drawable";
import { DrawContext } from "../graphics/DrawContext";
import { Mouse } from "../input/mouse";
import { Tile } from "./tile/tile";

export class Level {
    width: number;
    height: number;
    pixelHexValues: string[];
    loaded: boolean = false;
    camera: Camera;
    mouse: Mouse;
    entities: Drawable[];

    constructor(imageRef: any, camera: Camera, mouse: Mouse) {
        this.pixelHexValues = [];
        this.entities = [];
        this.camera = camera;
        this.mouse = mouse;
        var loadedImage = new Image();
        loadedImage.src = imageRef;
        loadedImage.onload = () => {
            this.width = loadedImage.width;
            this.height = loadedImage.height;
            var virtualCanvas = document.createElement('canvas');
            var context = virtualCanvas.getContext('2d');
            context.drawImage(loadedImage, 0, 0);
            var pixelData = context.getImageData(0, 0, this.width, this.height).data;
            for(var i = 0; i < pixelData.length / 4; i++) {
                var r = pixelData[i*4].toString(16).padStart(2, '0');
                var g = pixelData[i*4+1].toString(16).padStart(2, '0');
                var b = pixelData[i*4+2].toString(16).padStart(2, '0');
                var a = pixelData[i*4+3].toString(16).padStart(2, '0');
                this.pixelHexValues.push(`${r}${g}${b}${a}`);
            }
            
            this.loaded = true;
        }
    }

    addDrawable(e: Drawable) {
        this.entities.push(e);
    }

    update(delta: number) {
        if (!this.loaded) return;

        this.camera.update(delta);
    }

    render(screen: DrawContext) {
        if (!this.loaded) return;

        // get into tile coordinates for tile drawing
        const x0 = (-screen.transformX / screen.scale) >> Tile.TileSizeShift;
        const y0 = (-screen.transformY / screen.scale) >> Tile.TileSizeShift;
        const x1 = ((-screen.transformX + screen.width + Tile.TileSize * 2) / screen.scale) >> Tile.TileSizeShift;
        const y1 = ((-screen.transformY + screen.height + Tile.TileSize * 2) / screen.scale) >> Tile.TileSizeShift;

        for (var y = y0; y < y1; y++) {
            for (var x = x0; x < x1; x++) {
                screen.drawTile(x, y, Tile.TileSize, Tile.TileSize, this.getTile(x, y));
            }
        }

        this.entities.forEach(e => e.render(screen));

        screen.ctx.save();
        screen.ctx.resetTransform();
        screen.ctx.fillStyle = 'blue';
        screen.ctx.font = "30px Arial";
        screen.ctx.fillText(`Tile offset: ${x0}, ${y0}`, 10, 50);
        screen.ctx.fillText(`Hover tile: ${((this.mouse.x - screen.transformX) / screen.scale) >> Tile.TileSizeShift}, ${((this.mouse.y - screen.transformY) / screen.scale) >> Tile.TileSizeShift}`, 10, 100);
        screen.ctx.restore();
    }

    getTile(x: number, y: number): string {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return '-1';

        return this.pixelHexValues[x + y * this.width];
    }
}