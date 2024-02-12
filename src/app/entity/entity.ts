import { DrawContext } from "../graphics/drawContext";

export interface Entity {
    id: string;
    
    render(ctx: DrawContext): void;
    update(delta: number): void;
}