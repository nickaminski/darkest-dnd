import { DrawContext } from "../graphics/DrawContext";
import { Tile } from "../level/tile/tile";
import { Drawable } from "./drawable";

export class Player implements Drawable {
    x: number;
    y: number;
    image: HTMLImageElement;

    constructor(startX: number, startY: number, imgSrc: any) {
        this.x = startX;
        this.y = startY;
        this.image = new Image();
        this.image.src = imgSrc;
    }

    update(delta: number) {

    }

    render(screen: DrawContext) {
        screen.drawImage(this.x, this.y, this.image, Tile.TileSize, Tile.TileSize);
    }
}