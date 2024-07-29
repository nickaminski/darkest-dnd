export class PathfindingNode {
    tileRow: number;
    tileCol: number;
    parent: PathfindingNode;
    g: number;
    h: number;
    f: number;

    constructor(tileRow: number, tileCol: number, parent: PathfindingNode, g: number, h: number) {
        this.tileRow = tileRow;
        this.tileCol = tileCol;
        this.parent = parent;
        this.g = g;
        this.h = h;
        this.f = this.g + this.h;
    }
}