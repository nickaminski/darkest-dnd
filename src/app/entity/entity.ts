import { DrawContext } from "../graphics/DrawContext";

export interface Entity {
    render(ctx: DrawContext): void;
    update(delta: number, brightnessMap: number[][], explorationMap: boolean[][]): void;
}