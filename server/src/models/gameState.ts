import { GameTile } from "./gameTile";

export class GameState {
    tiles: GameTile[][];
    freezeCharacterMovement: boolean;

    constructor(rows: number, cols: number) {
        this.freezeCharacterMovement = false;
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

    exploreArea(topLeft: {row: number, col: number}, area: boolean[][]) {
        for(let r = topLeft.row; r < topLeft.row + area.length; r++) {
            for(let c = topLeft.col; c < topLeft.col + area[0].length; c++) {
                this.tiles[r][c].explored = area[r - topLeft.row][c - topLeft.col];
            }
        }
    }
}