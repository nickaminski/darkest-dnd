import { ImageBank } from "../graphics/imageBank";
import { PaintColor } from "../graphics/paintColor";

export class UIFactory {
    static createAdminControls(adminSpawnableNpcs: string[], adminPaintColors: PaintColor[], npcSpawnIdxCallback: (idx: number)=>void, colorIdxCallback: (idx: number)=>void): void {
        let uiContainer = document.getElementById('ui-controls');
        uiContainer.appendChild(this.createAdminNpcPanel(adminSpawnableNpcs, npcSpawnIdxCallback));
        uiContainer.appendChild(this.createAdminNpcButton(adminSpawnableNpcs));
        uiContainer.appendChild(this.createAdminColorPanel(adminPaintColors, colorIdxCallback));
        uiContainer.appendChild(this.createAdminColorButton());
    }

    static createUserControls(heroPortraitNames: string[], playerBtnSrc: string, portraitCallback: (src: string, file: File | string, fileType: string)=>void): void {
        let uiContainer = document.getElementById('ui-controls');
        uiContainer.appendChild(this.createCharacterPortraitButton(playerBtnSrc));
        uiContainer.appendChild(this.createCharacterPortraitPanel(heroPortraitNames, portraitCallback));
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
            this.togglePanel(npcContainer, '385px');
        });
        return npcButton;
    }

    private static createAdminColorButton(): HTMLDivElement {
        let background = document.createElement('div');
        background.classList.add('ui-toggle-button');
        background.style.left = '90px';
        
        let colorButton = document.createElement('img');
        colorButton.id = 'admin-color-toggle';
        colorButton.role = 'button';
        colorButton.src = ImageBank.getImageUrl('palette');
        colorButton.classList.add('ui-button', 'ui-icon-button');

        colorButton.addEventListener('click', e => {
            let colorContainer = document.getElementById('admin-colors');
            this.togglePanel(colorContainer, '448px');
        });
        background.appendChild(colorButton);
        return background;
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
            this.togglePanel(portraitContainer, '320px');
        });

        return portraitButton;
    }

    private static createAdminNpcPanel(adminSpawnableNpcs: string[], npcSpawnIdxCallback: (idx: number) => void): HTMLDivElement {
        let npcContainer = document.createElement('div');
        npcContainer.id = 'admin-npcs';
        npcContainer.classList.add('ui-panel', 'ui-panel-column');
        npcContainer.style.bottom = '84px';
        npcContainer.style.left = '16px';
        
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
        
        colorContainer.style.bottom = '84px';
        colorContainer.style.left = '90px';

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
        
        portrait.style.width = '256px';
        portrait.style.bottom = '84px';
        portrait.style.left = '16px';

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

    private static togglePanel(panel: HTMLElement, expandedHeight: string) {
        panel.style.height =
            panel.style.height === expandedHeight
                ? "0px"
                : expandedHeight;
    }
}