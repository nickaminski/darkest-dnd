import { BrightnessLevel } from "./brightness";

export class Tile {

    public static get TileSize(): number {
        return 1 << this.TileSizeShift;
    }

    public static get TileSizeShift(): number {
        return 6;
    }

    row: number;
    col: number;
    brightness: BrightnessLevel;
    isSolid: boolean;
    explored: boolean;
    paintOverColorHex: string;

    constructor(row: number, col: number, tileHex: string) {
        this.row = row;
        this.col = col;
        this.brightness = BrightnessLevel.Dark;
        this.explored = false;

        if (tileHex == '000000ff') {
            this.isSolid = true;
        }
    }
}