import { DrawContext } from "../graphics/drawContext";
import { Tile } from "../level/tile/tile";
import { Entity } from "./entity";

export class Player implements Entity {
    pixelx: number;
    pixely: number;
    image: HTMLImageElement;

    radiantLight = 5;
    dimLight = 4;

    constructor(startX: number, startY: number, imgSrc: any) {
        this.pixelx = startX;
        this.pixely = startY;
        this.image = new Image();
        this.image.src = imgSrc;
    }

    update(delta: number) {
    }

    render(drawCtx: DrawContext) {
        drawCtx.drawImage(this.pixelx, this.pixely, this.image, Tile.TileSize, Tile.TileSize);
    }

    calculateVision(brightnessMap: number[][], explorationMap: boolean[][], solidWallsMap: boolean[][]) {
        var tileX = (this.pixelx >> Tile.TileSizeShift);
        var tileY = (this.pixely >> Tile.TileSizeShift);
        this.floodVision(0, tileY, tileX, brightnessMap, explorationMap, solidWallsMap);
    }

    private floodVision(lightStep: number, tileX: number, tileY: number, brightnessMap: number[][], explorationMap: boolean[][], solidWallsMap: boolean[][]) {
        if (tileX < 0 || tileY < 0 || tileX >= brightnessMap.length || tileY >= brightnessMap[0].length) return;
        if (solidWallsMap[tileX][tileY]) return;
        if (lightStep == this.dimLight + this.radiantLight) return;
    
        if (lightStep < this.radiantLight) brightnessMap[tileX][tileY] = 100;
        else if (lightStep < this.radiantLight + this.dimLight && brightnessMap[tileX][tileY] < 50) brightnessMap[tileX][tileY] = 50;
    
        explorationMap[tileX][tileY] = true;
    
        this.floodVision(lightStep + 1, tileX - 1, tileY, brightnessMap, explorationMap, solidWallsMap);
        this.floodVision(lightStep + 1, tileX + 1, tileY, brightnessMap, explorationMap, solidWallsMap);
        this.floodVision(lightStep + 1, tileX, tileY - 1, brightnessMap, explorationMap, solidWallsMap);
        this.floodVision(lightStep + 1, tileX, tileY + 1, brightnessMap, explorationMap, solidWallsMap);
    }

}