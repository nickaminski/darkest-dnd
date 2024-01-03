import { DrawContext } from "../graphics/drawContext";
import { Tile } from "../level/tile/tile";
import { Entity } from "./entity";

export class Player implements Entity {
    pixelx: number;
    pixely: number;
    image: HTMLImageElement;
    pov: boolean;

    radiantLight = 5;
    dimLight = 4;

    constructor(startX: number, startY: number, imgSrc: any, pov: boolean) {
        this.pixelx = startX;
        this.pixely = startY;
        this.image = new Image();
        this.image.src = imgSrc;
        this.pov = pov;
    }

    update(delta: number) {
    }

    render(drawCtx: DrawContext) {
        drawCtx.drawImage(this.pixelx, this.pixely, this.image, Tile.TileSize, Tile.TileSize);
    }

    calculateVision(tileMap: Tile[][]) {
        var tileY = (this.pixely >> Tile.TileSizeShift);
        var tileX = (this.pixelx >> Tile.TileSizeShift);
        this.floodVision(0, tileY, tileX, tileMap);
    }

    private floodVision(lightStep: number, tileY: number, tileX: number, tileMap: Tile[][]) {
        if (tileY < 0 || tileX < 0 || tileY >= tileMap.length || tileX >= tileMap[0].length) return;
        if (tileMap[tileY][tileX].isSolid) return;
        if (lightStep == this.dimLight + this.radiantLight) return;
    
        if (lightStep < this.radiantLight) tileMap[tileY][tileX].brightness = 100;
        else if (lightStep < this.radiantLight + this.dimLight && tileMap[tileY][tileX].brightness < 50) tileMap[tileY][tileX].brightness = 50;
    
        tileMap[tileY][tileX].explored = true;
    
        this.floodVision(lightStep + 1, tileY - 1, tileX, tileMap);
        this.floodVision(lightStep + 1, tileY + 1, tileX, tileMap);
        this.floodVision(lightStep + 1, tileY, tileX - 1, tileMap);
        this.floodVision(lightStep + 1, tileY, tileX + 1, tileMap);
    }

}