export class PaintColor {
    hex: string;
    name: string;

    public static Clear: PaintColor = { hex: '', name: 'clear' };
    public static Black: PaintColor = { hex: '000000', name: 'black' };
    public static Trap: PaintColor = { hex: 'a300d5', name: 'trap' };
    public static Curio: PaintColor = { hex: '496bff', name: 'curio' };
    public static Red: PaintColor = { hex: 'ff0000', name: 'red' };
    public static Yellow: PaintColor = { hex: 'ffcc00', name: 'yellow' };
    public static Brown: PaintColor = { hex: 'ea5d00', name: 'brown' };
    public static FakeWall: PaintColor = { hex: '333333', name: 'fake wall' };
}