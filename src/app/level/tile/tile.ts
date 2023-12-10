export class Tile {

    public static get TileSize(): number {
        return 1 << this.TileSizeShift;
    }

    public static get TileSizeShift(): number {
        return 6;
    }
}