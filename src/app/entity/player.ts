import { DrawContext } from "../graphics/drawContext";
import { Level } from "../level/level";
import { PathfindingNode } from "../level/pathfindingNode";
import { Tile } from "../level/tile/tile";
import { Entity } from "./entity";

export class Player implements Entity {
    pixelx: number;
    pixely: number;
    tileRow: number;
    tileCol: number;
    image: HTMLImageElement;
    pov: boolean;
    level: Level;

    radiantLight = 5;
    dimLight = 4;

    moveSpeed = 0.1;
    currentMovePath: PathfindingNode[];
    moving = false;

    constructor(startTileRow: number, startTileCol: number, imgSrc: any, pov: boolean) {
        this.tileRow = startTileRow;
        this.tileCol = startTileCol;
        this.pixelx = this.tileCol << Tile.TileSizeShift;
        this.pixely = this.tileRow << Tile.TileSizeShift;
        this.image = new Image();
        this.image.src = imgSrc;
        this.pov = pov;
    }

    update(delta: number) {
        this.calculateVision(this.level.tileMap);
        if (this.currentMovePath && this.currentMovePath.length > 0) {
            this.move(delta);
        } else if (this.moving) {
            this.moving = false;
            this.level.needsRedraw = true;
        }
    }

    render(drawCtx: DrawContext) {
        drawCtx.drawImage(this.pixelx, this.pixely, this.image, Tile.TileSize, Tile.TileSize);
    }

    move(delta: number) {
        this.level.needsRedraw = true;
        this.level.recalculateMousePath = true;
        this.moving = true;

        var idx = this.currentMovePath.length - 1;
        var goalTile = this.currentMovePath[idx];
        var goalx = goalTile.tileCol << Tile.TileSizeShift;
        var goaly = goalTile.tileRow << Tile.TileSizeShift;
        if (Math.abs(this.pixelx - goalx) < 1 && Math.abs(this.pixely - goaly) < 1) {
            this.pixelx = goalx;
            this.pixely = goaly;
            this.tileRow = goalTile.tileRow;
            this.tileCol = goalTile.tileCol;
            this.currentMovePath.splice(idx, 1);
        }

        var dirY = Math.sign(goaly - this.pixely);
        var dirX = Math.sign(goalx - this.pixelx);

        this.pixelx += dirX * this.moveSpeed * delta;
        this.pixely += dirY * this.moveSpeed * delta;
    }

    calculateVision(tileMap: Tile[][]) {
        this.floodVision(0, this.tileRow, this.tileCol, tileMap);
    }

    private floodVision(lightStep: number, tileRow: number, tileCol: number, tileMap: Tile[][]) {
        if (tileRow < 0 || tileCol < 0 || tileRow >= tileMap.length || tileCol >= tileMap[0].length) return;
        if (tileMap[tileRow][tileCol].isSolid) return;
        if (lightStep == this.dimLight + this.radiantLight) return;
    
        if (lightStep < this.radiantLight) tileMap[tileRow][tileCol].brightness = 100;
        else if (lightStep < this.radiantLight + this.dimLight && tileMap[tileRow][tileCol].brightness < 50) tileMap[tileRow][tileCol].brightness = 50;
    
        tileMap[tileRow][tileCol].explored = true;
    
        this.floodVision(lightStep + 1, tileRow - 1, tileCol, tileMap);
        this.floodVision(lightStep + 1, tileRow + 1, tileCol, tileMap);
        this.floodVision(lightStep + 1, tileRow, tileCol - 1, tileMap);
        this.floodVision(lightStep + 1, tileRow, tileCol + 1, tileMap);
    }

    init(level: Level) {
        this.level = level;
    }

}