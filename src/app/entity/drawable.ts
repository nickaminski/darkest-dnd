import { DrawContext } from "../graphics/DrawContext";

export interface Drawable {
    render(ctx: DrawContext): void;
}