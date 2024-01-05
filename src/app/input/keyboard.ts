export class Keyboard {

    keys = new Map<string, boolean>();

    public get moveRight() {
        return this.keys.get('KeyD') || this.keys.get('ArrowRight');
    }

    public get moveLeft() {
        return this.keys.get('KeyA') || this.keys.get('ArrowLeft');
    }

    public get moveUp() {
        return this.keys.get('KeyW') || this.keys.get('ArrowUp');
    }

    public get moveDown() {
        return this.keys.get('KeyS') || this.keys.get('ArrowDown');
    }

    public get shift() {
        return this.keys.get('ShiftRight') || this.keys.get('ShiftLeft');
    }

    onKeyDown(e: KeyboardEvent) {
        this.keys.set(e.code, true);
    }

    onKeyUp(e: KeyboardEvent) {
        this.keys.set(e.code, false);
    }
}