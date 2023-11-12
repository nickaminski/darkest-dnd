import { DrawContext } from "../graphics/DrawContext";
import { Tile } from "../level/tile/tile";
import { Entity } from "./entity";

export class Player implements Entity {
    pixelx: number;
    pixely: number;
    image: HTMLImageElement;

    radiantLight = 4;
    dimLight = 4;

    constructor(startX: number, startY: number, imgSrc: any) {
        this.pixelx = startX;
        this.pixely = startY;
        this.image = new Image();
        this.image.src = imgSrc;
    }

    update(delta: number, brightnessMap: number[][], explorationMap: boolean[][]) {
        this.calculateVision(brightnessMap, explorationMap);
    }

    calculateVision(brightnessMap: number[][], explorationMap: boolean[][]) {
        const lightRadius = this.radiantLight + this.dimLight
        for(var y = -lightRadius; y < lightRadius + 1; y++) {
            var tileY = (this.pixely >> Tile.TileSizeShift) + y;
            if (tileY < 0 || tileY >= brightnessMap.length) continue;
            for (var x = -lightRadius; x < lightRadius + 1; x++) {
                var tileX = (this.pixelx >> Tile.TileSizeShift) + x;
                if (tileX < 0 || tileX >= brightnessMap[0].length) continue;
                
                if (Math.abs(y) + Math.abs(x) <= this.radiantLight) brightnessMap[tileY][tileX] = 1;
                else if (Math.abs(y) + Math.abs(x) <= this.radiantLight + this.dimLight) brightnessMap[tileY][tileX] = 0.5;

                explorationMap[tileY][tileX] = true;
            }
        }
    }

    render(screen: DrawContext) {
        screen.drawImage(this.pixelx, this.pixely, this.image, Tile.TileSize, Tile.TileSize);
    }
}