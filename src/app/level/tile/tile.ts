export class Tile {

    public static get TileSize(): number {
        return 1 << this.TileSizeShift;
    }

    public static get TileSizeShift(): number {
        return 6;
    }

    row: number;
    col: number;
    brightness: number;
    isSolid: boolean;
    explored: boolean;

    constructor(row: number, col: number) {
        this.row = row;
        this.col = col;
    }
}