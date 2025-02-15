import { PaintColor } from "../../graphics/paintColor";
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
    isWindow: boolean;
    explored: boolean;
    paintOverColorHex: string;

    shouldBeDrawn: boolean;

    constructor(row: number, col: number, tileHex: string) {
        this.row = row;
        this.col = col;
        this.brightness = BrightnessLevel.Dark;
        this.explored = false;
        this.isWindow = true;

        if (tileHex == '000000ff') {
            this.isSolid = true;
            this.isWindow = false;
        } else {
        }
    }

    invalidPathTile(): boolean {
        return this.isSolid ||
            this.paintOverColorHex == PaintColor.Black.hex ||
            this.paintOverColorHex == PaintColor.Brown.hex ||
            this.paintOverColorHex == PaintColor.FakeWall.hex;
    }
}