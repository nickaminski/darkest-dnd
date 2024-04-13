export class PaintColor {
    hex: string;
    name: string;

    public static Clear: PaintColor = { hex: '00000000', name: 'clear' };
    public static Black: PaintColor = { hex: '000000ff', name: 'black' };
    public static Trap: PaintColor = { hex: 'a300d5ff', name: 'trap' };
    public static Curio: PaintColor = { hex: '496bffff', name: 'curio' };
    public static Red: PaintColor = { hex: 'ff0000ff', name: 'red' };
    public static Yellow: PaintColor = { hex: 'ffcc00ff', name: 'yellow' };
    public static Brown: PaintColor = { hex: 'ea5d00ff', name: 'brown' };
    public static FakeWall: PaintColor = { hex: '333333ff', name: 'fake wall' };
}