import { ImageBank } from "../graphics/imageBank";
import { PaintColor } from "../graphics/paintColor";
import { Keyboard, KeyboardControl } from "./keyboard";

export class UIFactory {
    private static activePanel: HTMLElement | null = null;

    static createAdminControls(adminSpawnableNpcs: string[], adminPaintColors: PaintColor[], keyboard: Keyboard, npcSpawnIdxCallback: (idx: number)=>void, colorIdxCallback: (idx: number)=>void): void {
        let uiContainer = document.getElementById('ui-controls');
        uiContainer.appendChild(this.createAdminNpcPanel(adminSpawnableNpcs, npcSpawnIdxCallback));
        uiContainer.appendChild(this.createAdminNpcButton(adminSpawnableNpcs));
        uiContainer.appendChild(this.createAdminColorPanel(adminPaintColors, colorIdxCallback));
        uiContainer.appendChild(this.createAdminColorButton());
        uiContainer.appendChild(this.createKeyboardHelp(keyboard, true));
        uiContainer.appendChild(this.createKeyboardHelpButton());
    }

    static createUserControls(heroPortraitNames: string[], playerBtnSrc: string, keyboard: Keyboard, portraitCallback: (src: string, file: File | string, fileType: string)=>void): void {
        let uiContainer = document.getElementById('ui-controls');
        uiContainer.appendChild(this.createCharacterPortraitButton(playerBtnSrc));
        uiContainer.appendChild(this.createCharacterPortraitPanel(heroPortraitNames, portraitCallback));
        uiContainer.appendChild(this.createKeyboardHelp(keyboard, false));
        uiContainer.appendChild(this.createKeyboardHelpButton());
    }

    private static createAdminNpcButton(adminSpawnableNpcs: string[]): HTMLImageElement {
        let npcButton = document.createElement('img');
        npcButton.id = 'admin-npc-toggle';
        npcButton.role = 'button';
        npcButton.src = ImageBank.getImageUrl(adminSpawnableNpcs[0]);
        npcButton.classList.add('ui-button', 'ui-toggle-button');

        npcButton.style.left = '16px';

        npcButton.addEventListener('click', e => {
            console.log('clicked admin npc button');
            let npcContainer = document.getElementById('admin-npcs');
            this.togglePanel(npcContainer);
        });
        return npcButton;
    }

    private static createAdminColorButton(): HTMLDivElement {
        let colorButton = document.createElement('img');
        colorButton.id = 'admin-color-toggle';
        colorButton.role = 'button';
        colorButton.src = ImageBank.getImageUrl('palette');
        colorButton.classList.add('ui-button', 'ui-toggle-button');

        colorButton.style.left = '92px';
        colorButton.style.backgroundColor = 'lightgray';

        colorButton.addEventListener('click', e => {
            let colorContainer = document.getElementById('admin-colors');
            this.togglePanel(colorContainer);
        });
        return colorButton;
    }

    private static createCharacterPortraitButton(playerBtnSrc: string): HTMLImageElement {
        let portraitButton = document.createElement('img');
        portraitButton.id = 'btn-current-portrait';
        portraitButton.role = 'button';
        portraitButton.src = playerBtnSrc;
        portraitButton.classList.add('ui-button', 'ui-toggle-button');

        portraitButton.style.left = '16px';

        portraitButton.addEventListener('click', e => {
            let portraitContainer = document.getElementById('hero-portraits');
            this.togglePanel(portraitContainer);
        });

        return portraitButton;
    }

    private static createKeyboardHelpButton(): HTMLDivElement {
        
        let helpButton = document.createElement('img');
        helpButton.id = 'help-toggle';
        helpButton.role = 'button';
        helpButton.src = ImageBank.getImageUrl('help');
        helpButton.classList.add('ui-button', 'ui-toggle-button');

        helpButton.style.left = '164px';
        
        helpButton.addEventListener('click', () => {
            let helpContainer = document.getElementById('keyboard-help');

            this.togglePanel(helpContainer);
        });

        return helpButton;
    }

    private static createAdminNpcPanel(adminSpawnableNpcs: string[], npcSpawnIdxCallback: (idx: number) => void): HTMLDivElement {
        let npcContainer = document.createElement('div');
        npcContainer.id = 'admin-npcs';
        npcContainer.classList.add('ui-panel', 'ui-panel-column');
        
        adminSpawnableNpcs.forEach((npc, idx) => {
            let button = document.createElement('img');
            button.id = `btn-adminNpc-${npc}`;
            button.role = 'button';
            button.src = ImageBank.getImageUrl(npc);
            button.title = npc;

            button.classList.add('ui-button', 'ui-icon-button', 'ui-circle');

            if (idx === 0) button.classList.add('ui-selected');

            button.addEventListener('click', () => {
                adminSpawnableNpcs.forEach(name => 
                    document.getElementById(`btn-adminNpc-${name}`)?.classList.remove('ui-selected'));

                button.classList.add('ui-selected');

                npcSpawnIdxCallback(idx);

                (document.getElementById('admin-npc-toggle') as HTMLImageElement).src = ImageBank.getImageUrl(npc);
            });

            npcContainer.appendChild(button);
        });

        return npcContainer;
    }

    private static createAdminColorPanel(adminPaintColors: PaintColor[], colorIdxCallback: (idx: number) => void): HTMLDivElement {
        let colorContainer = document.createElement('div');
        colorContainer.id = 'admin-colors';
        colorContainer.classList.add('ui-panel', 'ui-panel-column');


        for (let c = 0; c < adminPaintColors.length; c++) {
            let color = adminPaintColors[c];
            let button = document.createElement('div');
            button.id = `btn-adminColor-${color.name}`;
            button.role = 'button';

            button.classList.add('ui-button', 'ui-paint-swatch');

            button.style.backgroundColor = `#${color.hex}`;
            button.style.borderColor = c == 0 ?  'green' : 'black';

            button.addEventListener('click', e => { 
                for (let i = 0; i < adminPaintColors.length; i++) {
                    document.getElementById(`btn-adminColor-${adminPaintColors[i].name}`).style.borderColor = 'black';
                }
                button.style.borderColor = 'green';
                colorIdxCallback(c);
                let hex = adminPaintColors[c].hex ?? '00000000';
                document.getElementById('admin-color-toggle').style.backgroundColor = `#${hex}`;
            });
            colorContainer.appendChild(button);
        }
        return colorContainer;
    }

    private static createCharacterPortraitPanel(heroPortraitNames: string[], portraitCallback: (src: string, file: File | string, fileType: string) => void): HTMLDivElement {
        let portrait = document.createElement('div');
        portrait.id = 'hero-portraits';
        portrait.classList.add('ui-panel', 'ui-panel-row', 'ui-panel-wrap');
        portrait.style.width = '228px';
        portrait.style.display = 'flex';

        for (let i = 0; i < heroPortraitNames.length; i++) {
            let button = document.createElement('img');
            button.id = `btn-portrait-${heroPortraitNames[i]}`;
            button.src = ImageBank.getImageUrl(heroPortraitNames[i]);
            button.role = 'button';
            button.classList.add('ui-icon-button', 'ui-button');

            button.addEventListener('click', e => {
                (document.getElementById('custom-image') as HTMLInputElement).value = null;
                let src = ImageBank.getImageUrl(heroPortraitNames[i]);
                portraitCallback(src, heroPortraitNames[i], 'image/png');
            });
            portrait.appendChild(button);
        }

        let button = document.createElement('label');
        button.id = `btn-portrait-custom`;
        button.role = 'button';
        button.classList.add('ui-icon-button', 'ui-icon-button');

        button.style.backgroundColor = 'green';

        let input = document.createElement('input');
        input.id = 'custom-image';
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.style.display = 'none';
        input.addEventListener('change', e => {
            if (input.files && input.files[0]) {
                if (!input.files[0].type.match(/image\/\w*/)) {
                    input.value = null;
                    alert('Invalid format');
                    return;
                }
                let src = URL.createObjectURL(input.files[0]);
                portraitCallback(src, input.files[0], input.files[0].type);
            }
        });
        button.appendChild(input);

        portrait.appendChild(button);

        return portrait;
    }

    private static createKeyboardHelp(keyboard: Keyboard, isAdmin: boolean): HTMLDivElement {
        let container = document.createElement('div');
        container.id = 'keyboard-help';
        container.classList.add('ui-panel');

        let controls = document.createElement('div');
        controls.classList.add('keyboard-controls');

        for (const control of keyboard.getControls()) {

            if (control.adminOnly && !isAdmin) {
                continue;
            }

            let row = this.createKeyboardControlRow(control, keyboard.getBindings(control.id));
            controls.appendChild(row);
        }

        container.appendChild(controls);

        return container;
    }

    private static createKeyboardControlRow(control: KeyboardControl, bindings: string[]): HTMLDivElement {
        let row = document.createElement('div');
        row.classList.add('keyboard-control-row');

        let keys = document.createElement('div');
        keys.classList.add('keyboard-control-keys');

        for (const code of bindings) {
            let keyElement = document.createElement('span');
            keyElement.classList.add('keyboard-key');
            keyElement.textContent = this.getKeyDisplayName(code);

            keys.appendChild(keyElement);
        }

        let description = document.createElement('div');
        description.classList.add('keyboard-control-description');
        description.textContent = control.description;

        row.appendChild(keys);
        row.appendChild(description);

        return row;
    }

    private static getKeyDisplayName(code: string): string {
        switch (code) {
            case 'ArrowUp':
                return '↑';

            case 'ArrowDown':
                return '↓';

            case 'ArrowLeft':
                return '←';

            case 'ArrowRight':
                return '→';

            case 'Space':
                return 'Space';

            case 'Escape':
                return 'Esc';

            default:
                if (code.startsWith('Key')) {
                    return code.substring(3);
                }

                if (code.startsWith('Digit')) {
                    return code.substring(5);
                }

                return code;
        }
    }

    private static togglePanel(panel: HTMLElement | null) {
        if (!panel) {
            return;
        }

        // Clicking the button for the currently open panel closes it.
        if (this.activePanel === panel) {
            panel.classList.remove('open');
            this.activePanel = null;
            return;
        }

        // Close any currently open panel.
        if (this.activePanel) {
            this.activePanel.classList.remove('open');
        }

        // Open the requested panel.
        panel.classList.add('open');
        this.activePanel = panel;
    }
}