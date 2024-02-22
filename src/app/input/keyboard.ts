export class Keyboard {

    keys = new Map<string, boolean>();

    didCycle = false;

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

    public get drawPath() {
        return this.keys.get('KeyZ');
    }

    public get stopPlayerMovement() {
        return this.keys.get('Space');
    }

    public get toggleLights() {
        return this.keys.get('KeyL');
    }

    public get cyclePov() {
        return this.keys.get('KeyF');
    }

    onKeyDown(e: KeyboardEvent) {
        this.keys.set(e.code, true);
    }

    onKeyUp(e: KeyboardEvent) {
        this.keys.set(e.code, false);
        this.didCycle = false;
    }
}