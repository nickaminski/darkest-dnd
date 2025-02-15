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

    private _currentPovCharacter: Character;

    public get currentPovCharacter() {
        return this._currentPovCharacter;
    }

    public set currentPovCharacter(val: Character) {
        if (this._currentPovCharacter) {
            this._currentPovCharacter.pov = false;
        }

        this._currentPovCharacter = val;

        if (this._currentPovCharacter) {
            this._currentPovCharacter.pov = true;
        }
    }

    DEBUG_USE_BRIGHTNESS = true;
    DEBUG_SHOW_TILE_LOC = false;

    constructor(mouse: Mouse, socket: Socket) {
        this.foregroundNeedsRedraw = true;
        this.pixelHexValues = [];
        this.entities = [];
        this.tileMap = [];
        this.mouse = mouse;

        this.mouse.$mouseClick.subscribe(e => {
            if (this.currentPovCharacter &&
                this.canCharactersMove &&
                this.mouse.mousePath &&
                this.mouse.mousePath.length > 0) {
                var thePath = [...this.mouse.mousePath];
                this.currentPovCharacter.currentMovePath = thePath;

                socket.emit('click', { id: this.currentPovCharacter.id, path: thePath });
            }
        });
    }

    loadMapData(playerId: string, mapData: any, gameState: any) {
        this.pixelHexValues = [...mapData.hexPixels];
        this.width = mapData.cols;
        this.height = mapData.rows;

        for (var i = 0; i < this.pixelHexValues.length; i++) {
            var row = Math.floor(i / this.width);
            var col = i % this.width;
            var newTile = new Tile(row, col, this.pixelHexValues[i]);

            if (!this.tileMap[row]) this.tileMap[row] = [];

            this.tileMap[row][col] = newTile;
        }

        for (var i = 0; i < this.tileMap.length; i++) {
            for (var j = 0; j < this.tileMap[0].length; j++) {
                this.tileMap[i][j].shouldBeDrawn = this.tileShouldBeDrawn(i, j);
            }
        }

        this.loaded = true;
        this.needsRedraw = true;

        this.entities.forEach(e => {
            if (e instanceof Character) {
                e.init(this);
                e.calculateVision(this.tileMap, e.playerId);
            }
        });

        this.loadGameState(playerId, gameState);

        this.recalculateVision = true;
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

    removeCharacterById(id: string): Character {
        const idx = this.entities.findIndex(x => x.id == id);

        if (idx != -1) {
            let entity = this.entities.splice(idx, 1)[0];
            if (entity instanceof Character) return entity as Character;
        }
    }

    removeEntitiesByPlayerId(playerId: string) {
        this.entities = this.entities.filter(x => x instanceof Character && x.playerId != playerId);
    }

    update(delta: number) {
        if (!this.loaded) return;

        if (this.recalculateVision) {
            this.tileMap.forEach(row => row.forEach(col => { col.brightness = 0 }));
            this.entities.forEach(e => { if (e instanceof Character) e.calculateVision(this.tileMap, e.playerId); });
            this.recalculateVision = false;
        }

        this.entities.forEach(e => e.update(delta));

        if (this.recalculateMousePath) {
            this.recalculateMousePath = false;
            if (this.currentPovCharacter) {
                this.mouse.mousePath = this.findPath(this.currentPovCharacter.tileRow, this.currentPovCharacter.tileCol, this.mouse.tileRow, this.mouse.tileCol);
            }
            else {
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
                if (tile && tile.shouldBeDrawn) {
                    drawContext.drawTile(y, x, Tile.TileSize, Tile.TileSize, this.getTileHex(y, x), tile?.paintOverColorHex, this.getBrightness(y, x));
                }
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

        if (this.DEBUG_SHOW_TILE_LOC) {
            drawContext.ctx.save();
            drawContext.ctx.resetTransform();
            drawContext.ctx.fillStyle = 'gray';
            drawContext.ctx.fillRect(0, 0, 260, 100);
            drawContext.ctx.fillStyle = 'blue';
            drawContext.ctx.font = '30px Arial';
            drawContext.ctx.fillText(`Tile offset: ${x0}, ${y0}`, 10, 35);
            drawContext.ctx.fillText(`Hover tile: ${this.mouse.tileCol}, ${this.mouse.tileRow}`, 10, 80);
            drawContext.ctx.restore();
        }
        this.needsRedraw = false;
    }

    loadGameState(playerId: string, gameState: any) {
        if (gameState.freezeCharacterMovement) {
            this.receiveFreeze(playerId);
        }
        if (this.loaded) {
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    let serverTile = gameState.tiles[r][c];
                    let localTile = this.getTile(r, c);
                    this.paintTile(localTile, serverTile.paintOverColorHex);
                    localTile.explored = serverTile.explored;
                }
            }
            this.recalculateVision = true;
        }
    }

    receiveFreeze(playerId: string): void {
        this.canCharactersMove = (!this.canCharactersMove || this.admin);
        this.drawFreezeVignette = !this.drawFreezeVignette;

        for (let c of this.getPlayerCharacters(playerId)) {
            c.freeze();
        }

        this.foregroundNeedsRedraw = true;
    }

    renderForeground(drawContext: DrawContext) {
        if (this.drawFreezeVignette) {
            drawContext.drawVignette();
        } else {
            drawContext.clear();
        }
        this.foregroundNeedsRedraw = false;
    }

    tileShouldBeDrawn(row: number, col: number): boolean {
        var up = this.getTile(row - 1, col);
        var down = this.getTile(row + 1, col);
        var left = this.getTile(row, col - 1);
        var right = this.getTile(row, col + 1);

        // only care about drawing tiles that we could possibly see
        let upShouldBlockUs = up && up.isSolid && !up.isWindow;
        let downShouldBlockUs = down && down.isSolid && !down.isWindow;
        let leftShouldBlockUs = left && left.isSolid && !left.isWindow;
        let rightShouldBlockUs = right && right.isSolid && !right.isWindow;
        return !(upShouldBlockUs && downShouldBlockUs && leftShouldBlockUs && rightShouldBlockUs);
    }

    getTile(row: number, col: number): Tile {
        if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
            return undefined;
        }
        return this.tileMap[row][col];
    }

    getTileHex(y: number, x: number): string {
        if (y < 0 || y >= this.height || x < 0 || x >= this.width) return '-1';
        return this.pixelHexValues[x + y * this.width];
    }

    paintTile(tile: Tile, colorHex: string) {
        if (tile) {
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
        if (goalTile == null || goalTile == undefined || goalTile.isSolid || startTile.isSolid) {
            return null;
        }

        var openList = [];
        var closedList = [];

        var dist = this.getDistance(startTileRow, startTileCol, goalTileRow, goalTileCol);
        var current = new PathfindingNode(startTileRow, startTileCol, null, 0, dist);

        openList.push(current);

        while (openList.length > 0) {
            openList.sort((a, b) => a.g - b.g);
            current = openList.shift();
            if (current.tileRow == goalTileRow && current.tileCol == goalTileCol) {
                var path = [];
                while (current.parent != null) {
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