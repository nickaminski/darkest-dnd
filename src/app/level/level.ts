import { Camera } from "../entity/camera";
import { Entity } from "../entity/entity";
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
    entities: Entity[];
    brightnessMap: number[][];
    explorationMap: boolean[][];
    needsRedraw: boolean = false;

    DEBUG_USE_BRIGHTNESS = true;

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

            this.brightnessMap = new Array(this.height).fill(-1).map(() => new Array(this.width).fill(-1));
            this.explorationMap = new Array(this.height).fill(false).map(() => new Array(this.width).fill(false));

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
            this.needsRedraw = true;
        }
    }

    addEntity(e: Entity) {
        this.entities.push(e);
    }

    update(delta: number) {
        if (!this.loaded) return;

        for(var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                this.brightnessMap[y][x] = -1;
            }
        }

        this.camera.update(delta, this);

        this.entities.forEach(e => e.update(delta, this.brightnessMap, this.explorationMap));
    }

    render(screen: DrawContext) {
        if (!this.loaded || !this.needsRedraw) return;
        screen.clear();

        // get into tile coordinates for tile drawing
        const x0 = (-screen.transformX / screen.scale) >> Tile.TileSizeShift;
        const y0 = (-screen.transformY / screen.scale) >> Tile.TileSizeShift;
        const x1 = ((-screen.transformX + screen.width + Tile.TileSize * 2) / screen.scale) >> Tile.TileSizeShift;
        const y1 = ((-screen.transformY + screen.height + Tile.TileSize * 2) / screen.scale) >> Tile.TileSizeShift;

        for (var y = y0; y < y1; y++) {
            for (var x = x0; x < x1; x++) {
                screen.drawTile(x, y, Tile.TileSize, Tile.TileSize, this.getTile(x, y), this.getBrightness(x, y));
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
        this.needsRedraw = false;
    }

    getTile(x: number, y: number): string {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return '-1';
        return this.pixelHexValues[x + y * this.width];
    }

    getBrightness(x: number, y: number): number {
        if (!this.DEBUG_USE_BRIGHTNESS) return 1;

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return -1;
        return this.brightnessMap[x][y];
    }
}