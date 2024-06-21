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

    static createUserControls(heroPortraitNames: string[], playerBtnSrc: string, portraitCallback: (src: string, file: File | string)=>void): void {
        let uiContainer = document.getElementById('ui-controls');
        uiContainer.appendChild(this.createCharacterPortraitButton(playerBtnSrc));
        uiContainer.appendChild(this.createCharacterPortraiPanel(heroPortraitNames, portraitCallback));
    }

    private static createAdminNpcButton(adminSpawnableNpcs: string[]): HTMLImageElement {
        let npcButton = document.createElement('img');
        npcButton.id = 'admin-npc-toggle';
        npcButton.role = 'button';
        npcButton.src = ImageBank.getImageUrl(adminSpawnableNpcs[0]);
        npcButton.style.position = 'fixed';
        npcButton.style.width = '52px';
        npcButton.style.height = '52px';
        npcButton.style.bottom = '16px';
        npcButton.style.left = '16px';
        npcButton.style.backgroundColor = 'lightgrey';
        npcButton.style.cursor = 'pointer';
        npcButton.style.userSelect = 'none';
        npcButton.addEventListener('click', e => {
            let npcContainer = document.getElementById('admin-npcs');
            if (npcContainer.style.height == '0px') {
                npcContainer.style.height = '312px';
            } else {
                npcContainer.style.height = '0px';
            }
        });
        return npcButton;
    }

    private static createAdminColorButton(): HTMLDivElement {
        let background = document.createElement('div');
        background.style.backgroundColor = 'lightgrey';
        background.style.position = 'fixed';
        background.style.bottom = '16px';
        background.style.left = '80px';
        background.style.width = '36px';
        background.style.height = '36px';

        let colorButton = document.createElement('img');
        colorButton.id = 'admin-color-toggle';
        colorButton.role = 'button';
        colorButton.src = ImageBank.getImageUrl('palette');
        colorButton.style.width = '36px';
        colorButton.style.height = '36px';
        colorButton.style.backgroundColor = 'lightgrey';
        colorButton.style.cursor = 'pointer';
        colorButton.style.userSelect = 'none';
        colorButton.addEventListener('click', e => {
            let colorContainer = document.getElementById('admin-colors');
            if (colorContainer.style.height == '0px') {
                colorContainer.style.height = '288px';
            } else {
                colorContainer.style.height = '0px';
            }
        });
        background.appendChild(colorButton);
        return background;
    }

    private static createCharacterPortraitButton(playerBtnSrc: string): HTMLImageElement {
        let portraitButton = document.createElement('img');
        portraitButton.id = 'btn-current-portrait';
        portraitButton.role = 'button';
        portraitButton.src = playerBtnSrc;
        portraitButton.style.position = 'fixed';
        portraitButton.style.width = '52px';
        portraitButton.style.height = '52px';
        portraitButton.style.bottom = '16px';
        portraitButton.style.left = '16px';
        portraitButton.style.backgroundColor = 'lightgrey';
        portraitButton.style.cursor = 'pointer';
        portraitButton.style.userSelect = 'none';

        portraitButton.addEventListener('click', e => {
            let portraitContainer = document.getElementById('hero-portraits');
            if (portraitContainer.style.height == '0px') {
                portraitContainer.style.height = '208px';
            } else {
                portraitContainer.style.height = '0px';
            }
        });

        return portraitButton;
    }

    private static createAdminNpcPanel(adminSpawnableNpcs: string[], npcSpawnIdxCallback: (idx: number) => void): HTMLDivElement {
        let npcContainer = document.createElement('div');
        npcContainer.id = 'admin-npcs';
        npcContainer.style.position = 'fixed';
        npcContainer.style.display = 'flex';
        npcContainer.style.flexFlow = 'column';
        npcContainer.style.bottom = '74px';
        npcContainer.style.left = '16px';
        npcContainer.style.backgroundColor = 'lightgrey';
        npcContainer.style.overflow = 'hidden';
        npcContainer.style.height = '0px';
        npcContainer.style.transition = '.2s';
        
        for (let c = 0; c < adminSpawnableNpcs.length; c++) {
            let npc = adminSpawnableNpcs[c];
            let button = document.createElement('img');
            button.id = `btn-adminNpc-${npc}`;
            button.role = 'button';
            button.src = ImageBank.getImageUrl(npc);
            button.title = npc;
            button.style.border = 'solid 3px';
            button.style.width = '48px';
            button.style.height = '48px'; 
            button.style.margin = '2px';
            button.style.borderRadius = '50%';
            button.style.cursor = 'pointer';
            button.style.userSelect = 'none';
            button.style.borderColor = c == 0 ?  'green' : 'black';

            button.addEventListener('click', e => {
                for (let i = 0; i < adminSpawnableNpcs.length; i++) {
                    document.getElementById(`btn-adminNpc-${adminSpawnableNpcs[i]}`).style.borderColor = 'black';
                }
                button.style.borderColor = 'green';
                npcSpawnIdxCallback(c);
                (document.getElementById('admin-npc-toggle') as HTMLImageElement).src = ImageBank.getImageUrl(npc);
            });
            npcContainer.appendChild(button);
        }

        return npcContainer;
    }

    private static createAdminColorPanel(adminPaintColors: PaintColor[], colorIdxCallback: (idx: number) => void): HTMLDivElement {
        let colorContainer = document.createElement('div');
        colorContainer.id = 'admin-colors';
        colorContainer.style.position = 'fixed';
        colorContainer.style.display = 'flex';
        colorContainer.style.bottom = '58px';
        colorContainer.style.flexFlow = 'column';
        colorContainer.style.left = '80px';
        colorContainer.style.backgroundColor = 'lightgrey';
        colorContainer.style.overflow = 'hidden';
        colorContainer.style.height = '0px';
        colorContainer.style.transition = '.2s';

        for (let c = 0; c < adminPaintColors.length; c++) {
            let color = adminPaintColors[c];
            let button = document.createElement('div');
            button.id = `btn-adminColor-${color.name}`;
            button.role = 'button';
            button.style.backgroundColor = `#${color.hex}`;
            button.style.border = 'solid 3px';
            button.style.width = '32px';
            button.style.height = '32px';
            button.style.userSelect = 'none';
            button.style.margin = '2px';
            button.style.cursor = 'pointer';
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

    private static createCharacterPortraiPanel(heroPortraitNames: string[], portraitCallback: (src: string, file: File | string) => void): HTMLDivElement {
        let portrait = document.createElement('div');
        portrait.id = 'hero-portraits';
        portrait.style.position = 'fixed';
        portrait.style.display = 'flex';
        portrait.style.flexFlow = 'row';
        portrait.style.flexWrap = 'wrap';
        portrait.style.bottom = '72px';
        portrait.style.left = '16px';
        portrait.style.backgroundColor = 'lightgrey';
        portrait.style.overflow = 'hidden';
        portrait.style.height = '0px';
        portrait.style.width = '260px';
        portrait.style.transition = '.2s';

        for (let i = 0; i < heroPortraitNames.length; i++) {
            let button = document.createElement('img');
            button.id = `btn-portrait-${heroPortraitNames[i]}`;
            button.src = ImageBank.getImageUrl(heroPortraitNames[i]);
            button.role = 'button';
            button.style.border = 'solid 3px';
            button.style.width = '48px';
            button.style.height = '48px';
            button.style.userSelect = 'none';
            button.style.margin = '2px';
            button.style.cursor = 'pointer';

            button.addEventListener('click', e => {
                (document.getElementById('custom-image') as HTMLInputElement).value = null;
                let src = ImageBank.getImageUrl(heroPortraitNames[i]);
                portraitCallback(src, heroPortraitNames[i]);
            });
            portrait.appendChild(button);
        }

        let button = document.createElement('label');
        button.id = `btn-portrait-custom`;
        button.role = 'button';
        button.style.border = 'solid 3px';
        button.style.width = '48px';
        button.style.height = '48px';
        button.style.userSelect = 'none';
        button.style.margin = '2px';
        button.style.cursor = 'pointer';
        button.style.backgroundColor = 'green';

        let input = document.createElement('input');
        input.id = 'custom-image';
        input.setAttribute('type', 'file');
        input.style.display = 'none';
        input.addEventListener('change', e => {
            if (input.files && input.files[0]) {
                let src = URL.createObjectURL(input.files[0]);
                portraitCallback(src, input.files[0]);
            }
        });
        button.appendChild(input);

        portrait.appendChild(button);

        return portrait;
    }
}