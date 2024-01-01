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
        var tileY = (this.pixely >> Tile.TileSizeShift);
        var tileX = (this.pixelx >> Tile.TileSizeShift);
        this.floodVision(0, tileY, tileX, brightnessMap, explorationMap, solidWallsMap);
    }

    private floodVision(lightStep: number, tileY: number, tileX: number, brightnessMap: number[][], explorationMap: boolean[][], solidWallsMap: boolean[][]) {
        if (tileY < 0 || tileX < 0 || tileY >= brightnessMap.length || tileX >= brightnessMap[0].length) return;
        if (solidWallsMap[tileY][tileX]) return;
        if (lightStep == this.dimLight + this.radiantLight) return;
    
        if (lightStep < this.radiantLight) brightnessMap[tileY][tileX] = 100;
        else if (lightStep < this.radiantLight + this.dimLight && brightnessMap[tileY][tileX] < 50) brightnessMap[tileY][tileX] = 50;
    
        explorationMap[tileY][tileX] = true;
    
        this.floodVision(lightStep + 1, tileY - 1, tileX, brightnessMap, explorationMap, solidWallsMap);
        this.floodVision(lightStep + 1, tileY + 1, tileX, brightnessMap, explorationMap, solidWallsMap);
        this.floodVision(lightStep + 1, tileY, tileX - 1, brightnessMap, explorationMap, solidWallsMap);
        this.floodVision(lightStep + 1, tileY, tileX + 1, brightnessMap, explorationMap, solidWallsMap);
    }

}