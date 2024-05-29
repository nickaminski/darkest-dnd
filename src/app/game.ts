import { DrawContext } from './graphics/drawContext';
import { Mouse } from './input/mouse';
import { Level } from './level/level';
import { Keyboard } from './input/keyboard';
import { Camera } from './entity/camera';
import { Character } from './entity/character';
import levelImage from '../assets/maps/weald.png';

import { Socket } from 'socket.io-client';
import { PaintColor } from './graphics/paintColor';
import { ImageBank } from './graphics/imageBank';

export class Game {
    socket: Socket;

    running: boolean = false;
    drawCtx: DrawContext;
    foregroundCtx: DrawContext;
    level: Level;
    keyboard: Keyboard;
    mouse: Mouse;
    camera: Camera;

    admin: boolean = false;
    adminCurrentColorIdx: number = 0;
    adminPaintColors = [ PaintColor.Clear, 
                         PaintColor.Black, 
                         PaintColor.Trap, 
                         PaintColor.Curio, 
                         PaintColor.Red, 
                         PaintColor.Yellow,
                         PaintColor.Brown,
                         PaintColor.FakeWall
                        ];

    heroPortraitNames = ['abomination',
                         'antiquarian',
                         'arbalist',
                         'bounty_hunter',
                         'crusader',
                         'grave_robber',
                         'hellion',
                         'highwayman',
                         'houndmaster',
                         'jester',
                         'leper',
                         'man_at_arms',
                         'musketeer',
                         'occultist',
                         'plague_doctor',
                         'vestal'
                        ];

    adminCurrentNpcSpawnIdx: number = 0;
    adminSpawnableNpcs = [
        'slime',
        'large_slime',
        'bone_soldier',
        'collected_rogue',
        'collected_cleric',
        'collected_warrior'
    ];

    public set width(newVal: number) {
        this.drawCtx.width = newVal;
        this.foregroundCtx.width = newVal;
    }

    public set height(newVal: number) {
        this.drawCtx.height = newVal;
        this.foregroundCtx.height = newVal;
    }

    constructor(gameCanvas: HTMLCanvasElement, foregroundCanvas: HTMLCanvasElement, socket: Socket) {
        var ctx = gameCanvas.getContext('2d');
        if (ctx == null) throw new DOMException('Could not get rendering context');

        this.drawCtx = new DrawContext(ctx, gameCanvas.width, gameCanvas.height);
        this.foregroundCtx = new DrawContext(foregroundCanvas.getContext('2d'), foregroundCanvas.width, foregroundCanvas.height);
        this.foregroundCtx.updateScale(1);
        this.drawCtx.updateTransform(0, 0);
        this.width = gameCanvas.width;
        this.height = gameCanvas.height;
        this.keyboard = new Keyboard();
        this.camera = new Camera(this.keyboard, this.drawCtx);
        this.mouse = new Mouse(this.keyboard);
        this.level = new Level(levelImage, this.mouse, socket);
        this.socket = socket;

        document.addEventListener('mousemove', (e) => this.mouse.onMouseMove(e, this.level, this.drawCtx, this.camera));
        document.addEventListener('wheel', (e) => this.mouse.onMouseWheel(e, this.drawCtx, this.level, this.camera));
        document.addEventListener('keydown', (e) => this.keyboard.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.keyboard.onKeyUp(e));
        document.addEventListener('mousedown', (e) => this.mouse.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.mouse.onMouseUp(e));

        document.addEventListener('touchstart', (e) => this.mouse.onTouchStart(e));
        document.addEventListener('touchend', (e) => this.mouse.onTouchEnd(e));
        document.addEventListener('touchmove', (e) => this.mouse.onTouchMove(e, this.level, this.drawCtx, this.camera));

        this.registerSocketListeningEvents();
    }

    update(delta: number): void {
        this.level.update(delta);
        this.camera.update(delta, this.level);

        if (this.admin)
        {
            this.handleAminControls();
        }
    }

    render(): void {
        if (this.level.needsRedraw)
        {
            this.level.render(this.drawCtx);
        }
        if (this.level.foregroundNeedsRedraw)
        {
            this.level.renderForeground(this.foregroundCtx);
        }
    }

    start(): void {
        this.running = true;
    }

    adminCyclePov(): void {
        let npcs = this.level.entities.filter(x => x instanceof Character && !x.shareVision) as Character[];
        if (npcs.length == 0) return;

        let idx = npcs.findIndex(x => x.pov);
        if (idx != -1)
        {
            npcs[idx].pov = false;
        }
        idx = npcs.findIndex(x => x.tileCol == this.mouse.tileCol && x.tileRow == this.mouse.tileRow);
        if (idx != -1)
        {
            npcs[idx].pov = true;
        }

        this.level.recalculateMousePath = true;
        this.level.needsRedraw = true;
    }

    adminCycleNpcs(): void {
        this.adminCurrentNpcSpawnIdx++;
        this.adminCurrentNpcSpawnIdx %= this.adminSpawnableNpcs.length;
        (document.getElementById('admin-npc-toggle') as HTMLImageElement).src = ImageBank.getImageUrl(this.adminSpawnableNpcs[this.adminCurrentNpcSpawnIdx]);

        for (let i = 0; i < this.adminSpawnableNpcs.length; i++) {
            let b = document.getElementById(`btn_adminNpc_${this.adminSpawnableNpcs[i]}`);
            b.style.borderColor = this.adminCurrentNpcSpawnIdx == i ? 'green' : 'black';
        }
    }

    adminCycleColor(): void {
        this.adminCurrentColorIdx = (this.adminCurrentColorIdx + 1) % this.adminPaintColors.length;
        let hex = this.adminPaintColors[this.adminCurrentColorIdx].hex ?? '00000000';
        document.getElementById('admin-color-toggle').style.backgroundColor = `#${hex}`;
        for (let c = 0; c < this.adminPaintColors.length; c++) {
            let b = document.getElementById(`btn_adminColor_${this.adminPaintColors[c].name}`);
            b.style.borderColor = this.adminCurrentColorIdx == c ? 'green' : 'black';
        }
    }

    adminPlaceColor(): void {
        let tile = this.level.getTile(this.mouse.tileRow, this.mouse.tileCol);
        if (tile)
        {
            this.level.paintTile(tile, this.adminPaintColors[this.adminCurrentColorIdx].hex);
            this.level.needsRedraw = true;
            this.socket.emit('admin-paint', { row: this.mouse.tileRow, col: this.mouse.tileCol, colorHex: this.adminPaintColors[this.adminCurrentColorIdx].hex });
        }
    }

    adminRemoveCharacter(): void {
        let pov = this.level.entities.find(x => x instanceof Character && x.pov);
        if (pov)
        {
            this.socket.emit('despawn-character', pov.id);
            this.level.removeEntityById(pov.id);
            this.level.needsRedraw = true;
            this.level.recalculateMousePath = true;
        }
    }

    adminPlaceNpc(): void {
        let spawnData = { userId: uuid(), tileRow: this.mouse.tileRow, tileCol: this.mouse.tileCol, imageName: this.adminSpawnableNpcs[this.adminCurrentNpcSpawnIdx]};
        this.spawnCharacter(false, spawnData.userId, spawnData.tileRow, spawnData.tileCol, spawnData.imageName, false, false, null);
        this.socket.emit('admin-spawn', spawnData);
    }

    adminFreezeCharacterMovement(): void {
        this.level.drawFreezeVignette = !this.level.drawFreezeVignette;
        this.level.foregroundNeedsRedraw = true;
        this.socket.emit('admin-freeze-all');
    }

    registerSocketListeningEvents(): void {
        this.socket.on('connect', () => {
            if (this.level.loaded) {
                this.socket.emit('create-game-state', { rows: this.level.height, cols: this.level.width });
            }
        });

        this.socket.on('initialize-character', (message: any) => {
            this.spawnCharacter(message.admin, 
                             message.userId, 
                             message.userTileRow, 
                             message.userTileCol, 
                             message.imageName, 
                             message.pov, 
                             message.shareVision,
                             message.imageFile);
        });

        this.socket.on('disconnect-user', (playerId: string) => {
            this.level.removeEntityById(playerId);
            this.level.needsRedraw = true;
            this.level.recalculateVision = true;
        });

        this.socket.on('move-character', (data) => {
            let character = this.level.entities.find(x => x.id == data.id) as Character;
            if (!character) return;

            character.currentMovePath = data.path;
        });

        this.socket.on('stop-character', (userId: string) => {
            let character = this.level.entities.find(x => x.id == userId) as Character;
            if (!character) return;

            character.stopPathMovement();
        });

        this.socket.on('admin-paint', (paintData) => {
            this.level.paintTile(this.level.getTile(paintData.row, paintData.col), paintData.colorHex);
            this.level.recalculateVision = true;
            this.level.needsRedraw = true;
        });

        this.socket.on('despawn-character', (id) => {
            this.level.removeEntityById(id);
            this.level.needsRedraw = true;
            this.level.recalculateVision = true;
        });

        this.socket.on('receive-game-state', (gameState) => {
            if (gameState.freezeCharacterMovement)
            {
                this.receiveFreeze();
            }
            if (this.level.loaded)
            {
                for(let r = 0; r < this.level.height; r++) {
                    for(let c = 0; c < this.level.width; c++) {
                        let serverTile = gameState.tiles[r][c];
                        let localTile = this.level.getTile(r, c);
                        this.level.paintTile(localTile, serverTile.paintOverColorHex);
                        localTile.explored = serverTile.explored;
                    }
                }
                let pov = this.level.getPov();
                if (pov)
                {
                    pov.calculateVision(this.level.tileMap);
                }
            }
        });

        this.socket.on('change-image', (imageData: {id: string, file: ArrayBuffer, name: string}) => {
            let entity = this.level.getCharacter(imageData.id);
            if (entity) {
                if (imageData.file){
                    entity.image.src = URL.createObjectURL(new Blob([new Uint8Array(imageData.file)], { type: 'application/octet-stream' }));
                }
                else if (imageData.name)
                    entity.image.src = ImageBank.getImageUrl(imageData.name);
            }
        });

        this.socket.on('freeze', () => {
            this.receiveFreeze();
        });
    }

    receiveFreeze(): void {
        this.level.canCharactersMove = !this.level.canCharactersMove;
        this.level.drawFreezeVignette = !this.level.drawFreezeVignette;
        this.level.getPov()?.freeze();
        this.level.foregroundNeedsRedraw = true;
    }

    handleAminControls(): void {
        if (this.keyboard.toggleLights && !this.level.DEBUG_USE_BRIGHTNESS)
        {
            this.level.DEBUG_USE_BRIGHTNESS = true;
            this.level.needsRedraw = true;
        }
        else if (!this.keyboard.toggleLights && this.level.DEBUG_USE_BRIGHTNESS)
        {
            this.level.DEBUG_USE_BRIGHTNESS = false;
            this.level.needsRedraw = true;
        }

        if (this.keyboard.cyclePov && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminCyclePov();
        }

        if (this.keyboard.cycleColor && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminCycleColor();
        }

        if (this.keyboard.placeColor && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminPlaceColor();
        }

        if (this.keyboard.removeCharacter && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminRemoveCharacter();
        }

        if (this.keyboard.cycleNpc && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminCycleNpcs();
        }

        if (this.keyboard.placeNpc && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminPlaceNpc();
        }

        if (this.keyboard.freezeCharacterMovement && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminFreezeCharacterMovement();
        }
    }

    spawnCharacter(admin: boolean, userId: string, tileRow: number, tileCol: number, imageName: string, pov: boolean, shareVision: boolean, imageFile: ArrayBuffer) {
        this.level.needsRedraw = true;
        if (admin) 
        {
            this.admin = true;
            this.level.admin = true;
            this.level.DEBUG_USE_BRIGHTNESS = false;

            this.createAdminControls();
            return;
        }

        var character = new Character(userId, tileRow, tileCol, this.keyboard, imageName, pov, shareVision, imageFile, this.socket);
        this.level.addEntity(character);
        if (pov) {
            this.camera.setCameraPosition((-character.pixelx + window.innerWidth / 2) * this.drawCtx.scale, (-character.pixely + window.innerHeight / 2) * this.drawCtx.scale);
            this.createUserControls();
        }
    }

    createAdminControls(): void {
        let uiContainer = document.getElementById('ui-controls');
        uiContainer.appendChild(this.createAdminNpcPanel());
        uiContainer.appendChild(this.createAdminNpcButton());
        uiContainer.appendChild(this.createAdminColorPanel());
        uiContainer.appendChild(this.createAdminColorButton());
    }

    createUserControls(): void {
        let uiContainer = document.getElementById('ui-controls');
        uiContainer.appendChild(this.createCharacterPortraitButton());
        uiContainer.appendChild(this.createCharacterPortraiPanel());
    }

    createAdminNpcButton(): HTMLImageElement {
        let npcButton = document.createElement('img');
        npcButton.id = 'admin-npc-toggle';
        npcButton.role = 'button';
        npcButton.src = ImageBank.getImageUrl(this.adminSpawnableNpcs[this.adminCurrentColorIdx]);
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

    createAdminColorButton(): HTMLDivElement {
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

    createCharacterPortraitButton(): HTMLDivElement {
        let portraitButton = document.createElement('img');
        portraitButton.id = 'admin-npc-toggle';
        portraitButton.role = 'button';
        portraitButton = this.level.getPov().image;
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

    createAdminNpcPanel(): HTMLDivElement {
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
        
        for (let c = 0; c < this.adminSpawnableNpcs.length; c++) {
            let npc = this.adminSpawnableNpcs[c];
            let button = document.createElement('img');
            button.id = `btn_adminNpc_${npc}`;
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
                for (let i = 0; i < this.adminSpawnableNpcs.length; i++) {
                    document.getElementById(`btn_adminNpc_${this.adminSpawnableNpcs[i]}`).style.borderColor = 'black';
                }
                button.style.borderColor = 'green';
                this.adminCurrentNpcSpawnIdx = c;
                (document.getElementById('admin-npc-toggle') as HTMLImageElement).src = ImageBank.getImageUrl(npc);
            });
            npcContainer.appendChild(button);
        }

        return npcContainer;
    }

    createAdminColorPanel(): HTMLDivElement {
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

        for (let c = 0; c < this.adminPaintColors.length; c++) {
            let color = this.adminPaintColors[c];
            let button = document.createElement('div');
            button.id = `btn_adminColor_${color.name}`;
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
                for (let i = 0; i < this.adminPaintColors.length; i++) {
                    document.getElementById(`btn_adminColor_${this.adminPaintColors[i].name}`).style.borderColor = 'black';
                }
                button.style.borderColor = 'green';
                this.adminCurrentColorIdx = c;
                let hex = this.adminPaintColors[this.adminCurrentColorIdx].hex ?? '00000000';
                document.getElementById('admin-color-toggle').style.backgroundColor = `#${hex}`;
            });
            colorContainer.appendChild(button);
        }
        return colorContainer;
    }

    createCharacterPortraiPanel(): HTMLDivElement {
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

        for (let i = 0; i < this.heroPortraitNames.length; i++) {
            let button = document.createElement('img');
            button.id = `btn_portrait_${this.heroPortraitNames[i]}`;
            button.src = ImageBank.getImageUrl(this.heroPortraitNames[i]);
            button.role = 'button';
            button.style.border = 'solid 3px';
            button.style.width = '48px';
            button.style.height = '48px';
            button.style.userSelect = 'none';
            button.style.margin = '2px';
            button.style.cursor = 'pointer';

            button.addEventListener('click', e => {
                (document.getElementById('custom_image') as HTMLInputElement).value = null;
                let pov = this.level.getPov();
                pov.image.src = ImageBank.getImageUrl(this.heroPortraitNames[i]);
                this.socket.emit('change-image', { id: pov.id, name: this.heroPortraitNames[i]});
            });
            portrait.appendChild(button);
        }

        let button = document.createElement('label');
        button.id = `btn_portrait_custom`;
        button.role = 'button';
        button.style.border = 'solid 3px';
        button.style.width = '48px';
        button.style.height = '48px';
        button.style.userSelect = 'none';
        button.style.margin = '2px';
        button.style.cursor = 'pointer';
        button.style.backgroundColor = 'green';

        let input = document.createElement('input');
        input.id = 'custom_image';
        input.setAttribute('type', 'file');
        input.style.display = 'none';
        input.addEventListener('change', e => {
            if (input.files && input.files[0]) {
                let pov = this.level.getPov();
                pov.image.src = URL.createObjectURL(input.files[0]);
                this.socket.emit('change-image', { id: pov.id, file: input.files[0]});
            }
        });
        button.appendChild(input);

        portrait.appendChild(button);

        return portrait;
    }
}

function uuid() {
    return ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, c => (
        parseInt(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (parseInt(c) / 4)))).toString(16)
    );
}