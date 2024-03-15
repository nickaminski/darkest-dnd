import { GameTile } from "./gameTile";

export class GameState {
    tiles: GameTile[][];

    constructor(rows: number, cols: number) {
        this.tiles = [];
        for(let r = 0; r < rows; r++) {
            this.tiles.push([]);
            for(let c = 0; c < cols; c++) {
                this.tiles[r][c] = { explored: false, paintOverColorHex: '' };
            }
        }
    }

    paintTile(row: number, col: number, colorHex: string) {
        this.tiles[row][col].paintOverColorHex = colorHex;
    }
}