import { Entity } from "../entity/entity";
import { Player } from "../entity/player";
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
    recalculateMousePath: boolean = false;

    DEBUG_USE_BRIGHTNESS = true;
    DEBUG_SHOW_TILE_LOC = false;

    constructor(imageRef: any, mouse: Mouse) {
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
                var newTile = new Tile(row, col);

                if (!this.tileMap[row]) this.tileMap[row] = [];

                newTile.brightness = BrightnessLevel.Dark;
                newTile.explored = false;

                if (this.pixelHexValues[i] == '000000ff') {
                    newTile.isSolid = true;
                }

                this.tileMap[row][col] = newTile;
            }
            this.loaded = true;
            this.needsRedraw = true;
            
            this.entities.forEach(e => {
                if (e instanceof Player) {
                    e.init(this);
                    e.calculateVision(this.tileMap);
                }
            });
        }

        this.mouse.$mouseClick.subscribe(e=> {
            if(this.mouse.mousePath) {
                var pov = this.entities.find(x => x instanceof Player && x.pov) as Player;
                var thePath = [...this.mouse.mousePath];
                pov.currentMovePath = thePath;
            }
        });
    }

    addEntity(e: Entity) {
        this.entities.push(e);

        if (e instanceof Player && this.loaded) {
            e.init(this);
            e.calculateVision(this.tileMap);
        }
    }

    removeEntityById(id: string) {
        const idx = this.entities.findIndex(x => x.id == id);

        if (idx != -1) {
            this.entities.splice(idx, 1);
        }
    }

    update(delta: number) {
        if (!this.loaded) return;

        this.tileMap.forEach(row => row.forEach(col => {col.brightness = 0}));

        this.entities.forEach(e => e.update(delta));

        if (this.recalculateMousePath)
        {
            this.recalculateMousePath = false;
            var pov = this.entities.find(x => x instanceof Player && x.pov) as Player;
            if (pov)
            {
                this.mouse.mousePath = this.findPath(pov.tileRow, pov.tileCol, this.mouse.tileY, this.mouse.tileX);
            }
        }
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
                drawContext.drawTile(y, x, Tile.TileSize, Tile.TileSize, this.getTileHex(y, x), this.getBrightness(y, x));
            }
        }

        this.entities.forEach(e => e.render(drawContext));

        this.mouse.render(drawContext);

        if (this.DEBUG_SHOW_TILE_LOC)
        {
            drawContext.ctx.save();
            drawContext.ctx.resetTransform();
            drawContext.ctx.fillStyle = 'blue';
            drawContext.ctx.font = "30px Arial";
            drawContext.ctx.fillText(`Tile offset: ${x0}, ${y0}`, 10, 50);
            drawContext.ctx.fillText(`Hover tile: ${this.mouse.tileX}, ${this.mouse.tileY}`, 10, 100);
            drawContext.ctx.restore();
        }
        this.needsRedraw = false;
    }

    getTile(row: number, col: number): Tile {
        if (row < 0 || row >= this.height || col < 0 || col >= this.width) return undefined;
        return this.tileMap[row][col];
    }

    getTileHex(y: number, x: number): string {
        if (y < 0 || y >= this.height || x < 0 || x >= this.width) return '-1';
        return this.pixelHexValues[x + y * this.width];
    }

    getBrightness(y: number, x: number): number {
        if (!this.DEBUG_USE_BRIGHTNESS) return BrightnessLevel.Radiant;

        if (y < 0 || y >= this.height || x < 0 || x >= this.width) return BrightnessLevel.Dark;

        if (this.tileMap[y][x].explored && this.tileMap[y][x].brightness == BrightnessLevel.Dark) {
            return BrightnessLevel.Explored;
        }

        return this.tileMap[y][x].brightness;
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
                    if (tile.isSolid || !tile.explored) continue;

                    var top = this.getTile(current.tileRow - 1, current.tileCol);
                    var bottom = this.getTile(current.tileRow + 1, current.tileCol);
                    var left = this.getTile(current.tileRow, current.tileCol - 1);
                    var right = this.getTile(current.tileRow, current.tileCol + 1);

                    if (i == -1 && j == -1) {
                        if (top.isSolid || left.isSolid) continue;
                    }
                    if (i == -1 && j == 1) {
                        if (top.isSolid || right.isSolid) continue;
                    }
                    if (i == 1 && j == -1) {
                        if (left.isSolid || bottom.isSolid) continue;
                    }
                    if (i == 1 && j == 1) {
                        if (bottom.isSolid || right.isSolid) continue;
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