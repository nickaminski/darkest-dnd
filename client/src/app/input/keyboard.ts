export type KeyboardControl = {
    id: string;
    defaultCodes: string[];
    displayName: string;
    description: string;
    adminOnly?: boolean;
};

type KeyState = {
    down: boolean;
    pressed: boolean;
};

export class Keyboard {

    /**
     * All controls available in the game.
     *
     * This is the single source of truth for:
     * - What controls exist
     * - Their default bindings
     * - How they are displayed in the help UI
     * - Whether they are admin-only
     */
    public static readonly controls: KeyboardControl[] = [

        {
            id: 'moveRight',
            defaultCodes: ['KeyD', 'ArrowRight'],
            displayName: 'Move Right',
            description: 'Move camera right'
        },

        {
            id: 'moveLeft',
            defaultCodes: ['KeyA', 'ArrowLeft'],
            displayName: 'Move Left',
            description: 'Move camera left'
        },

        {
            id: 'moveUp',
            defaultCodes: ['KeyW', 'ArrowUp'],
            displayName: 'Move Up',
            description: 'Move camera up'
        },

        {
            id: 'moveDown',
            defaultCodes: ['KeyS', 'ArrowDown'],
            displayName: 'Move Down',
            description: 'Move camera down'
        },

        {
            id: 'drawPath',
            defaultCodes: ['KeyZ'],
            displayName: 'Draw Path',
            description: 'Draw a movement path'
        },

        {
            id: 'stopCharacterMovement',
            defaultCodes: ['Space'],
            displayName: 'Stop Movement',
            description: 'Stop the current character'
        },

        {
            id: 'toggleLights',
            defaultCodes: ['KeyL'],
            displayName: 'Toggle Lights',
            description: 'Toggle lights',
            adminOnly: true
        },

        {
            id: 'selectPov',
            defaultCodes: ['KeyF'],
            displayName: 'Select POV',
            description: 'Select hovered character'
        },

        {
            id: 'cycleColor',
            defaultCodes: ['KeyE'],
            displayName: 'Cycle Color',
            description: 'Cycle the paint color',
            adminOnly: true
        },

        {
            id: 'placeColor',
            defaultCodes: ['KeyC'],
            displayName: 'Place Color',
            description: 'Paint the hovered tile',
            adminOnly: true
        },

        {
            id: 'removeCharacter',
            defaultCodes: ['Escape'],
            displayName: 'Remove Character',
            description: 'Remove the selected character'
        },

        {
            id: 'cycleNpc',
            defaultCodes: ['KeyR'],
            displayName: 'Cycle NPC',
            description: 'Cycle through NPCs',
            adminOnly: true
        },

        {
            id: 'placeNpc',
            defaultCodes: ['KeyV'],
            displayName: 'Place NPC',
            description: 'Place an NPC',
            adminOnly: true
        },

        {
            id: 'freezeCharacterMovement',
            defaultCodes: ['KeyP'],
            displayName: 'Freeze Movement',
            description: 'Freeze character movement',
            adminOnly: true
        }
    ];

    /**
     * Physical keyboard state.
     *
     * The keys in this map are KeyboardEvent.code values,
     * such as "KeyW", "Space", "ArrowUp", etc.
     */
    private keys = new Map<string, KeyState>();

    /**
     * Current bindings for each control.
     *
     * This starts with the defaults but can be changed
     * when a user remaps their controls.
     */
    private bindings = new Map<string, string[]>();

    constructor() {
        this.resetBindings();
    }

    /**
     * Initialize all bindings to their default values.
     */
    public resetBindings(): void {
        this.bindings.clear();

        for (const control of Keyboard.controls) {
            this.bindings.set(
                control.id,
                [...control.defaultCodes]
            );
        }
    }

    /**
     * Reset one control to its default binding.
     */
    public resetBinding(controlId: string): void {
        const control = this.getControl(controlId);

        if (!control) {
            return;
        }

        this.bindings.set(
            control.id,
            [...control.defaultCodes]
        );
    }

    /**
     * Change the keys assigned to a control.
     *
     * Example:
     *
     * keyboard.setBinding('moveUp', ['KeyI']);
     */
    public setBinding(controlId: string, codes: string[]): void {
        if (!this.getControl(controlId)) {
            return;
        }

        this.bindings.set(
            controlId,
            [...codes]
        );
    }

    /**
     * Get the currently assigned keys for a control.
     */
    public getBindings(controlId: string): string[] {
        return [...(this.bindings.get(controlId) ?? [])];
    }

    /**
     * Get a control definition.
     */
    public getControl(controlId: string): KeyboardControl | undefined {
        return Keyboard.controls.find(
            control => control.id === controlId
        );
    }

    public getControls(): KeyboardControl[] {
        return [...Keyboard.controls];
    }

    /**
     * Check whether a control is currently being held down.
     *
     * Use this for continuous actions such as movement.
     */
    public isDown(controlId: string): boolean {
        const codes = this.bindings.get(controlId);

        if (!codes) {
            return false;
        }

        return codes.some(code =>
            this.keys.get(code)?.down === true
        );
    }

    /**
     * Check whether a control was pressed during this frame.
     *
     * Unlike isDown(), this only becomes true once when
     * the key transitions from up -> down.
     */
    public wasPressed(controlId: string): boolean {
        const codes = this.bindings.get(controlId);

        if (!codes) {
            return false;
        }

        return codes.some(code =>
            this.keys.get(code)?.pressed === true
        );
    }

    /**
     * Called by the browser when a key is pressed.
     */
    public onKeyDown(e: KeyboardEvent): void {

        // Browsers repeatedly fire keydown while a key is held.
        // We only want the first keydown to count as "pressed".
        if (e.repeat) {
            return;
        }

        let state = this.keys.get(e.code);

        if (!state) {
            state = {
                down: false,
                pressed: false
            };

            this.keys.set(e.code, state);
        }

        // Only set pressed when transitioning from
        // not-down -> down.
        if (!state.down) {
            state.pressed = true;
        }

        state.down = true;
    }

    /**
     * Called by the browser when a key is released.
     */
    public onKeyUp(e: KeyboardEvent): void {
        const state = this.keys.get(e.code);

        if (!state) {
            return;
        }

        state.down = false;
    }

    /**
     * Clear one-shot key presses.
     *
     * This should be called once after the current game
     * update has processed all keyboard input.
     */
    public endFrame(): void {
        for (const state of this.keys.values()) {
            state.pressed = false;
        }
    }
}