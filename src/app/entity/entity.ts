import { DrawContext } from "../graphics/drawContext";

export interface Entity {
    render(ctx: DrawContext): void;
    update(delta: number): void;
}