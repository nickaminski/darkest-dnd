import { Socket } from "socket.io-client";
import { Entity } from "../entity/entity";
import { Character } from "../entity/character";
import { DrawContext } from "../graphics/drawContext";
import { Mouse } from "../input/mouse";
import { PathfindingNode } from "./pathfindingNode";
import { BrightnessLevel } from "./tile/brightness";
import { Tile } from "./tile/tile";

export class Level {
    width: number;
    height: number;
    pixelHexValues: string[];
    loaded: boolean = false;
    mouse: Mouse;
    entities: Entity[];
    tileMap: Tile[][];
    needsRedraw: boolean = false;
    foregroundNeedsRedraw: boolean = false;
    recalculateMousePath: boolean = false;
    recalculateVision: boolean = true;
    admin: boolean = false;
    drawFreezeVignette: boolean = false;
    canCharactersMove: boolean = true;
    currentPovCharacter: Character;

    DEBUG_USE_BRIGHTNESS = true;
    DEBUG_SHOW_TILE_LOC = false;

    constructor(imageRef: any, mouse: Mouse, socket: Socket) {
        this.foregroundNeedsRedraw = true;
        this.pixelHexValues = [];
        this.entities = [];
        this.tileMap = [];
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
                const hexValue = `${r}${g}${b}${a}`;
                this.pixelHexValues.push(hexValue);
            }

            for (var i = 0; i < this.pixelHexValues.length; i++) {
                var row = Math.floor(i/this.width);
                var col = i%this.width;
                var newTile = new Tile(row, col, this.pixelHexValues[i]);

                if (!this.tileMap[row]) this.tileMap[row] = [];

                this.tileMap[row][col] = newTile;
            }
            this.loaded = true;
            this.needsRedraw = true;
            
            this.entities.forEach(e => {
                if (e instanceof Character) {
                    e.init(this);
                    e.calculateVision(this.tileMap, e.playerId);
                }
            });

            if (socket.connected)
            {
                socket.emit('create-game-state', { rows: this.height, cols: this.width });
            }
        }

        this.mouse.$mouseClick.subscribe(e=> {
            if(this.currentPovCharacter &&
                this.canCharactersMove && 
                this.mouse.mousePath && 
                this.mouse.mousePath.length > 0) 
                {
                   var thePath = [...this.mouse.mousePath];
                   this.currentPovCharacter.currentMovePath = thePath;
       
                   socket.emit('click', {id: this.currentPovCharacter.id, path: thePath });
            }
        });
    }

    addEntity(e: Entity) {
        this.entities.push(e);

        if (e instanceof Character && this.loaded) {
            e.init(this);
            e.calculateVision(this.tileMap, e.playerId);
        }
    }

    getCharacter(id: string): Character {
        return this.entities.find(x => x instanceof Character && x.id == id) as Character;
    }

    getPlayerCharacters(playerId: string): Character[] {
        return this.entities.filter(x => x instanceof Character && x.playerId == playerId) as Character[];
    }

    removeEntityById(id: string) {
        const idx = this.entities.findIndex(x => x.id == id);

        if (idx != -1) {
            this.entities.splice(idx, 1);
        }
    }

    removeEntitiesByPlayerId(playerId: string) {
        this.entities = this.entities.filter(x => x instanceof Character && x.playerId != playerId);
    }

    update(delta: number) {
        if (!this.loaded) return;

        if (this.recalculateVision) {
            this.tileMap.forEach(row => row.forEach(col => {col.brightness = 0}));
            this.entities.forEach(e => {if (e instanceof Character) e.calculateVision(this.tileMap, e.playerId); });
            this.recalculateVision = false;
        }

        this.entities.forEach(e => e.update(delta));

        if (this.recalculateMousePath)
        {
            this.recalculateMousePath = false;
            if (this.currentPovCharacter)
            {
                this.mouse.mousePath = this.findPath(this.currentPovCharacter.tileRow, this.currentPovCharacter.tileCol, this.mouse.tileRow, this.mouse.tileCol);
            }
            else
            {
                this.mouse.mousePath = [];
            }
        }
    }

    render(drawContext: DrawContext) {
        if (!this.loaded) return;
        drawContext.clearBlack();

        // get into tile coordinates for tile drawing
        const x0 = (-drawContext.transformX / drawContext.scale) >> Tile.TileSizeShift;
        const y0 = (-drawContext.transformY / drawContext.scale) >> Tile.TileSizeShift;
        const x1 = ((-drawContext.transformX + drawContext.width) / drawContext.scale) >> Tile.TileSizeShift;
        const y1 = ((-drawContext.transformY + drawContext.height) / drawContext.scale) >> Tile.TileSizeShift;

        for (var y = y0; y < y1 + 1; y++) {
            for (var x = x0; x < x1 + 1; x++) {
                let tile = this.getTile(y, x);
                drawContext.drawTile(y, x, Tile.TileSize, Tile.TileSize, this.getTileHex(y, x), tile?.paintOverColorHex, this.getBrightness(y, x));
            }
        }

        this.entities.forEach(e => {
            e.render(drawContext);
            if (e instanceof Character && this.currentPovCharacter) {
                if (e.id == this.currentPovCharacter.id) {
                    drawContext.highlightTile(e.tileRow, e.tileCol, '00ff00ff');
                } else if (e.playerId == this.currentPovCharacter.playerId) {
                    drawContext.highlightTile(e.tileRow, e.tileCol, '0000ffff');
                } 
            }
        });

        this.mouse.render(drawContext);

        if (this.DEBUG_SHOW_TILE_LOC)
        {
            drawContext.ctx.save();
            drawContext.ctx.resetTransform();
            drawContext.ctx.fillStyle = 'blue';
            drawContext.ctx.font = '30px Arial';
            drawContext.ctx.fillText(`Tile offset: ${x0}, ${y0}`, 10, 50);
            drawContext.ctx.fillText(`Hover tile: ${this.mouse.tileCol}, ${this.mouse.tileRow}`, 10, 100);
            drawContext.ctx.restore();
        }
        this.needsRedraw = false;
    }

    renderForeground(drawContext: DrawContext) {
        if (this.drawFreezeVignette) {
            drawContext.drawVignette();
        } else {
            drawContext.clear();
        }
        this.foregroundNeedsRedraw = false;
    }

    getTile(row: number, col: number): Tile {
        if (row < 0 || row >= this.height || col < 0 || col >= this.width) return undefined;
        return this.tileMap[row][col];
    }

    getTileHex(y: number, x: number): string {
        if (y < 0 || y >= this.height || x < 0 || x >= this.width) return '-1';
        return this.pixelHexValues[x + y * this.width];
    }

    paintTile(tile: Tile, colorHex: string) {
        if (tile)
        {
            tile.paintOverColorHex = colorHex;
        }
    }

    getBrightness(row: number, col: number): number {
        if (!this.DEBUG_USE_BRIGHTNESS) return BrightnessLevel.Radiant;

        if (row < 0 || row >= this.height || col < 0 || col >= this.width) return BrightnessLevel.Dark;

        if (this.tileMap[row][col].explored && this.tileMap[row][col].brightness < BrightnessLevel.Dim) {
            return BrightnessLevel.Explored;
        }

        return this.tileMap[row][col].brightness;
    }

    findPath(startTileRow: number, startTileCol: number, goalTileRow: number, goalTileCol: number): PathfindingNode[] {
        var startTile = this.getTile(startTileRow, startTileCol);
        var goalTile = this.getTile(goalTileRow, goalTileCol);
        if (goalTile == null || goalTile == undefined || goalTile.isSolid || startTile.isSolid){
            return null;
        } 

        var openList = [];
        var closedList = [];
        
        var dist = this.getDistance(startTileRow, startTileCol, goalTileRow, goalTileCol);
        var current = new PathfindingNode(startTileRow, startTileCol, null, 0, dist);

        openList.push(current);

        while(openList.length > 0) 
        {
            openList.sort((a, b) => a.g - b.g);
            current = openList.shift();
            if (current.tileRow == goalTileRow && current.tileCol == goalTileCol)
            {
                var path = [];
                while(current.parent != null) {
                    path.push(current);
                    current = current.parent;
                }
                path.push(current);
                return path;
            }
            closedList.push(current);

            for (var i = -1; i < 2; i++) {
                for (var j = -1; j < 2; j++) {
                    if (i == 0 && j == 0) continue;

                    var tile = this.getTile(current.tileRow + i, current.tileCol + j);
                    if (tile == undefined || tile == null) continue;
                    if (tile.invalidPathTile() || (!tile.explored && !this.admin)) continue;
                    
                    var top = this.getTile(current.tileRow - 1, current.tileCol);
                    var bottom = this.getTile(current.tileRow + 1, current.tileCol);
                    var left = this.getTile(current.tileRow, current.tileCol - 1);
                    var right = this.getTile(current.tileRow, current.tileCol + 1);

                    if (i == -1 && j == -1) {
                        if (top.invalidPathTile() || left.invalidPathTile()) continue;
                    }
                    if (i == -1 && j == 1) {
                        if (top.invalidPathTile() || right.invalidPathTile()) continue;
                    }
                    if (i == 1 && j == -1) {
                        if (left.invalidPathTile() || bottom.invalidPathTile()) continue;
                    }
                    if (i == 1 && j == 1) {
                        if (bottom.invalidPathTile() || right.invalidPathTile()) continue;
                    }
    
                    var gCost = current.g + this.getDistance(current.tileRow, current.tileCol, tile.row, tile.col);
                    var hCost = this.getDistance(tile.row, tile.col, goalTileRow, goalTileCol);
    
                    var node = new PathfindingNode(tile.row, tile.col, current, gCost, hCost);

                    if (closedList.find(x => x.tileCol == node.tileCol && x.tileRow == node.tileRow) && gCost >= current.g) continue;
                    if (!openList.find(x => x.tileCol == node.tileCol && x.tileRow == node.tileRow) || gCost < current.g) openList.push(node);
                }
            }
        }
        closedList = [];
        return null;
    }

    getDistance(r0: number, c0: number, r1: number, c1: number): number {
        var dx = r0 - r1;
        var dy = c0 - c1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}