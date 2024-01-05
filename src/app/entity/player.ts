import { DrawContext } from "../graphics/drawContext";
import { Level } from "../level/level";
import { PathfindingNode } from "../level/pathfindingNode";
import { Tile } from "../level/tile/tile";
import { Entity } from "./entity";

export class Player implements Entity {
    pixelx: number;
    pixely: number;
    image: HTMLImageElement;
    pov: boolean;
    level: Level;

    radiantLight = 5;
    dimLight = 4;

    moveSpeed = 0.1;
    currentMovePath: PathfindingNode[];

    constructor(startX: number, startY: number, imgSrc: any, pov: boolean) {
        this.pixelx = startX;
        this.pixely = startY;
        this.image = new Image();
        this.image.src = imgSrc;
        this.pov = pov;
    }

    update(delta: number) {
        this.calculateVision(this.level.tileMap);
        if (this.currentMovePath && this.currentMovePath.length > 0) {
            this.move(delta);
        }
    }

    render(drawCtx: DrawContext) {
        drawCtx.drawImage(this.pixelx, this.pixely, this.image, Tile.TileSize, Tile.TileSize);
    }

    move(delta: number) {
        this.level.needsRedraw = true;
        this.level.recalculateMousePath = true;

        var tileY = (this.pixely >> Tile.TileSizeShift);
        var tileX = (this.pixelx >> Tile.TileSizeShift);
        var idx = this.currentMovePath.length - 1;
        var goalTile = this.currentMovePath[idx];
        if (tileX == goalTile.tileCol && tileY == goalTile.tileRow) {
            this.currentMovePath.splice(idx, 1);
        }

        var dirY = goalTile.tileRow - tileY;
        var dirX = goalTile.tileCol - tileX;

        this.pixelx += dirX * this.moveSpeed * delta;
        this.pixely += dirY * this.moveSpeed * delta;
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

    init(level: Level) {
        this.level = level;
    }

}