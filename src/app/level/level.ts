import { Camera } from "../entity/camera";
import { Entity } from "../entity/entity";
import { Player } from "../entity/player";
import { DrawContext } from "../graphics/drawContext";
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
    solidWallsMap: boolean[][];
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

            this.brightnessMap = new Array(this.height).fill(0).map(() => new Array(this.width).fill(0));
            this.explorationMap = new Array(this.height).fill(true).map(() => new Array(this.width).fill(true));
            this.solidWallsMap = new Array(this.height).fill(false).map(() => new Array(this.width).fill(false));

            var virtualCanvas = document.createElement('canvas');
            var context = virtualCanvas.getContext('2d');
            context.drawImage(loadedImage, 0, 0);
            var pixelData = context.getImageData(0, 0, this.width, this.height).data;
            for(var i = 0; i < pixelData.length / 4; i++) {
                var r = pixelData[i*4].toString(16).padStart(2, '0');
                var g = pixelData[i*4+1].toString(16).padStart(2, '0');
                var b = pixelData[i*4+2].toString(16).padStart(2, '0');
                var a = pixelData[i*4+3].toString(16).padStart(2, '0');
                const hexValue = `${r}${g}${b}${a}`
                this.pixelHexValues.push(hexValue);
            }

            for (var i = 0; i < this.pixelHexValues.length; i++) {
                if (this.pixelHexValues[i] == '000000ff') {
                    this.solidWallsMap[Math.floor(i/this.width)][i%this.width] = true;
                }
            }
            this.loaded = true;
            this.needsRedraw = true;
            
            this.entities.forEach(e => {
                if (e instanceof Player) {
                    e.calculateVision(this.brightnessMap, this.explorationMap, this.solidWallsMap);
                }
            });
        }
    }

    addEntity(e: Entity) {
        this.entities.push(e);

        if (e instanceof Player && this.loaded) {
            e.calculateVision(this.brightnessMap, this.explorationMap, this.solidWallsMap);
        }
    }

    update(delta: number) {
        if (!this.loaded) return;

        this.camera.update(delta, this);

        this.entities.forEach(e => e.update(delta));
    }

    render(drawContext: DrawContext) {
        if (!this.loaded || !this.needsRedraw) return;
        drawContext.clear();

        // get into tile coordinates for tile drawing
        const x0 = (-drawContext.transformX / drawContext.scale) >> Tile.TileSizeShift;
        const y0 = (-drawContext.transformY / drawContext.scale) >> Tile.TileSizeShift;
        const x1 = ((-drawContext.transformX + drawContext.width + Tile.TileSize * 2) / drawContext.scale) >> Tile.TileSizeShift;
        const y1 = ((-drawContext.transformY + drawContext.height + Tile.TileSize * 2) / drawContext.scale) >> Tile.TileSizeShift;

        for (var y = y0; y < y1; y++) {
            for (var x = x0; x < x1; x++) {
                drawContext.drawTile(y, x, Tile.TileSize, Tile.TileSize, this.getTile(y, x), this.getBrightness(y, x));
            }
        }

        this.entities.forEach(e => e.render(drawContext));

        drawContext.ctx.save();
        drawContext.ctx.resetTransform();
        drawContext.ctx.fillStyle = 'blue';
        drawContext.ctx.font = "30px Arial";
        drawContext.ctx.fillText(`Tile offset: ${x0}, ${y0}`, 10, 50);
        drawContext.ctx.fillText(`Hover tile: ${((this.mouse.x - drawContext.transformX) / drawContext.scale) >> Tile.TileSizeShift}, ${((this.mouse.y - drawContext.transformY) / drawContext.scale) >> Tile.TileSizeShift}`, 10, 100);
        drawContext.ctx.restore();
        this.needsRedraw = false;
    }

    getTile(y: number, x: number): string {
        if (y < 0 || y >= this.height || x < 0 || x >= this.width) return '-1';
        return this.pixelHexValues[x + y * this.width];
    }

    getBrightness(y: number, x: number): number {
        if (!this.DEBUG_USE_BRIGHTNESS) return 1;

        if (y < 0 || y >= this.height || x < 0 || x >= this.width) return 0;

        if (this.explorationMap[y][x] && this.brightnessMap[y][x] < 25) 
            return 25;

        return this.brightnessMap[y][x];
    }
}