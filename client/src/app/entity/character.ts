import { Socket } from "socket.io-client";
import { DrawContext } from "../graphics/drawContext";
import { Keyboard } from "../input/keyboard";
import { Level } from "../level/level";
import { PathfindingNode } from "../level/pathfindingNode";
import { BrightnessLevel } from "../level/tile/brightness";
import { Tile } from "../level/tile/tile";
import { Entity } from "./entity";
import { ImageBank } from "../graphics/imageBank";

export class Character implements Entity {
    id: string;
    playerId: string;
    pixelx: number;
    pixely: number;
    tileRow: number;
    tileCol: number;
    image: HTMLImageElement;
    pov: boolean;
    level: Level;
    keyboard: Keyboard;
    socket: Socket;
    shareVision: boolean;

    radiantLightDistance = 5;
    dimLightDistance = 4;

    moveSpeed = 0.1;
    currentMovePath: PathfindingNode[];
    moving = false;

    constructor(characterId: string, playerId: string, startTileRow: number, startTileCol: number, keyboard: Keyboard, imageName: string, shareVision: boolean, imageData: ArrayBuffer, socket: Socket) {
        this.id = characterId;
        this.playerId = playerId;
        this.tileRow = startTileRow;
        this.tileCol = startTileCol;
        this.pixelx = this.tileCol << Tile.TileSizeShift;
        this.pixely = this.tileRow << Tile.TileSizeShift;
        this.keyboard = keyboard;
        this.image = new Image();
        
        if (imageData) {
            this.image.src = URL.createObjectURL(new Blob([new Uint8Array(imageData)]));
        } else {
            this.image.src = ImageBank.getImageUrl(imageName);
        }

        this.shareVision = shareVision;
        this.socket = socket;
    }

    update(delta: number) {
        if (this.pov) {
            if (this.keyboard.stopCharacterMovement && this.currentMovePath?.length > 0) {
                this.freeze();
            }
        }
        if (this.currentMovePath?.length > 0) {
            this.move(delta);
        } else if (this.moving) {
            this.moving = false;
            this.level.needsRedraw = true;
        }
    }

    render(drawCtx: DrawContext) {
        if (this.level.getBrightness(this.tileRow, this.tileCol) >= BrightnessLevel.Dim)
            drawCtx.drawImage(this.pixelx, this.pixely, this.image, Tile.TileSize, Tile.TileSize);
    }

    move(delta: number) {
        this.level.needsRedraw = true;
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
            this.level.recalculateMousePath = true;
            this.level.recalculateVision = true;
        }

        var dirY = Math.sign(goaly - this.pixely);
        var dirX = Math.sign(goalx - this.pixelx);

        this.pixelx += dirX * this.moveSpeed * delta;
        this.pixely += dirY * this.moveSpeed * delta;
    }

    calculateVision(tileMap: Tile[][], playerId: string) {
        if (!this.shareVision || !this.level.loaded) return;
        this.floodVision(0, this.tileRow, this.tileCol, tileMap);
        
        if (this.playerId == playerId && this.moving)
        {
            this.sendExploredTiles(tileMap);
        }
    }

    private floodVision(lightStep: number, tileRow: number, tileCol: number, tileMap: Tile[][]) {
        if (tileRow < 0 || tileCol < 0 || tileRow >= tileMap.length || tileCol >= tileMap[0].length) return;
        if (lightStep == this.dimLightDistance + this.radiantLightDistance) return;
        
        tileMap[tileRow][tileCol].explored = true;
        
        if (lightStep < this.radiantLightDistance) tileMap[tileRow][tileCol].brightness = BrightnessLevel.Radiant;
        else if (lightStep < this.radiantLightDistance + this.dimLightDistance && tileMap[tileRow][tileCol].brightness < BrightnessLevel.Dim) tileMap[tileRow][tileCol].brightness = BrightnessLevel.Dim;
        
        if (tileMap[tileRow][tileCol].invalidPathTile()) return;
        
        this.floodVision(lightStep + 1, tileRow - 1, tileCol, tileMap);
        this.floodVision(lightStep + 1, tileRow + 1, tileCol, tileMap);
        this.floodVision(lightStep + 1, tileRow, tileCol - 1, tileMap);
        this.floodVision(lightStep + 1, tileRow, tileCol + 1, tileMap);
    }

    init(level: Level) {
        this.level = level;
        this.image.onload = () => {
            this.level.needsRedraw = true;
        }
    }

    stopPathMovement(): void {
        if (this.currentMovePath) {
            while (this.currentMovePath.length > 1)
                this.currentMovePath.shift();
        }
    }

    freeze(): void {
        if (!this.currentMovePath) return;
        this.stopPathMovement();
        let targetTile = this.currentMovePath[0];
        let row = targetTile?.tileRow ?? this.tileRow;
        let col = targetTile?.tileCol ?? this.tileCol;
        this.socket.emit('stopped', { id: this.id, tileRow: row, tileCol: col });
    }

    private sendExploredTiles(tileMap: Tile[][]) {
        let radius = this.dimLightDistance + this.radiantLightDistance;
        let area: Boolean[][] = [];
        let topRow = this.tileRow - radius;
        let leftCol = this.tileCol - radius;

        if (topRow < 0) topRow = 0;
        if (leftCol < 0) leftCol = 0;

        for(let r = topRow; r < this.tileRow + radius + 1; r++) {
            if (r > tileMap.length - 1) continue;
            area.push([]);
            for(let c = leftCol; c < this.tileCol + radius + 1; c++) {
                if (c > tileMap[0].length - 1) continue;
                area[area.length - 1].push(tileMap[r][c].explored);
            }
        }

        if (area.length > 0)
        {
            this.socket.emit('explored-area', { topLeft: { row: topRow, col: leftCol }, area: area});
        }
    }

}