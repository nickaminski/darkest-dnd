import { DrawContext } from './graphics/drawContext';
import { Mouse } from './input/mouse';
import { Level } from './level/level';
import { Keyboard } from './input/keyboard';
import { Camera } from './entity/camera';
import { Character } from './entity/character';

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
    playerBtnSrc: string;
    playerId: string;

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
        this.level = new Level(this.mouse, socket);
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

        this.handlePlayerControls();

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

    cyclePov(): void {
        let npcs = this.level.entities.filter(x => x instanceof Character && x.playerId == this.playerId) as Character[];
        if (npcs.length == 0) return;

        let idx = npcs.findIndex(x => x.tileCol == this.mouse.tileCol && x.tileRow == this.mouse.tileRow);
        if (idx != -1)
        {
            npcs[idx].pov = true;
            this.level.currentPovCharacter = npcs[idx];
            this.setCharacterPortraitButtonImage(this.level.currentPovCharacter.image.src);
        } else if (this.admin) {
            npcs.forEach(x => x.pov = false);
            this.level.currentPovCharacter = null;
        }
        this.level.recalculateMousePath = true;
        this.level.needsRedraw = true;
    }

    handlePlayerControls() {
        if (this.keyboard.cyclePov && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.cyclePov();
        }
        if (this.keyboard.removeCharacter && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            if (this.admin || this.level.getPlayerCharacters(this.playerId).length > 0) {
                this.removePovCharacter();
            }
        }
        if (this.keyboard.placeNpc && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.placeMinion();
        }
    }

    adminCycleNpcs(): void {
        this.adminCurrentNpcSpawnIdx++;
        this.adminCurrentNpcSpawnIdx %= this.adminSpawnableNpcs.length;
        (document.getElementById('admin-npc-toggle') as HTMLImageElement).src = ImageBank.getImageUrl(this.adminSpawnableNpcs[this.adminCurrentNpcSpawnIdx]);

        for (let i = 0; i < this.adminSpawnableNpcs.length; i++) {
            let b = document.getElementById(`btn-adminNpc-${this.adminSpawnableNpcs[i]}`);
            b.style.borderColor = this.adminCurrentNpcSpawnIdx == i ? 'green' : 'black';
        }
    }

    adminCycleColor(): void {
        this.adminCurrentColorIdx = (this.adminCurrentColorIdx + 1) % this.adminPaintColors.length;
        let hex = this.adminPaintColors[this.adminCurrentColorIdx].hex ?? '00000000';
        document.getElementById('admin-color-toggle').style.backgroundColor = `#${hex}`;
        for (let c = 0; c < this.adminPaintColors.length; c++) {
            let b = document.getElementById(`btn-adminColor-${this.adminPaintColors[c].name}`);
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

    removePovCharacter(): void {
        if (this.level.currentPovCharacter)
        {
            this.socket.emit('despawn-character', {playerId: this.playerId, characterId: this.level.currentPovCharacter.id});
        }
    }

    placeMinion(): void {
        let spawnData = { playerId: this.playerId, tileRow: this.mouse.tileRow, tileCol: this.mouse.tileCol, imageName: '' };
        if (this.admin) {
            spawnData.imageName = this.adminSpawnableNpcs[this.adminCurrentNpcSpawnIdx];
        }
        this.socket.emit('spawn-minion', spawnData);
    }

    adminFreezeCharacterMovement(): void {
        this.level.drawFreezeVignette = !this.level.drawFreezeVignette;
        this.level.foregroundNeedsRedraw = true;
        this.socket.emit('admin-freeze-all');
    }

    loadPlayerData(playerData: any) {
        this.playerId = playerData.id;
        this.admin = playerData.admin;
        this.level.admin = playerData.admin;
        this.level.DEBUG_USE_BRIGHTNESS = !playerData.admin;

        let characters = this.level.getPlayerCharacters(this.playerId);

        if (characters && characters.length > 0) {
            // race condition for characters loading before player gets their id
            characters[0].pov = true;
            this.level.currentPovCharacter = characters[0];
            this.camera.goToCharacter(characters[0]);
            
            if (!this.admin) {
                this.setCharacterPortraitButtonImage(characters[0].image.src);
            }
        }
        
        if (playerData.admin) {
            this.createAdminControls();
        } else {
            this.createUserControls();
        }
    }

    loadMapData(playerData: any, mapData: any, gameState: any) {
        this.level.loadMapData(playerData.id, mapData.buffer, gameState);
    }

    receiveGameState(gameState: any) {
        this.level.loadGameState(this.playerId, gameState);
    }

    registerSocketListeningEvents(): void {
        this.socket.on('initialize-game-state', (data) => {
            this.loadPlayerData(data.playerData);
            this.loadMapData(data.playerData, data.mapData, data.gameState);
        });

        this.socket.on('initialize-characters', (characterList: any) => {
            characterList.forEach((character: any) => {
                this.spawnCharacter(character);
            });
            this.level.recalculateVision = true;
        });

        this.socket.on('disconnect-user', (playerId: string) => {
            this.level.removeEntitiesByPlayerId(playerId);
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
            let char = this.level.removeCharacterById(id);
            this.level.needsRedraw = true;
            this.level.recalculateVision = true;

            if (char.playerId == this.playerId) {
                // if our own character was removed, cycle pov to another of our available characters
                let myCharacters = this.level.getPlayerCharacters(this.playerId);
                if (myCharacters.length > 0) {
                    this.level.currentPovCharacter = myCharacters[0];
                    myCharacters[0].pov = true;
                    this.setCharacterPortraitButtonImage(myCharacters[0].image.src);
                } else {
                    this.level.currentPovCharacter = null;
                }
            }
        });

        this.socket.on('receive-game-state', (gameState) => {
            if (gameState.freezeCharacterMovement)
            {
                this.level.receiveFreeze(this.playerId);
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
                this.level.recalculateVision = true;
            }
        });

        this.socket.on('change-image', (imageData: {characterId: string, file: ArrayBuffer, name: string}) => {
            let entity = this.level.getCharacter(imageData.characterId);
            if (entity) {
                if (imageData.file){
                    entity.image.src = URL.createObjectURL(new Blob([new Uint8Array(imageData.file)], { type: 'application/octet-stream' }));
                }
                else if (imageData.name)
                    entity.image.src = ImageBank.getImageUrl(imageData.name);
            }
        });

        this.socket.on('freeze', () => {
            this.level.receiveFreeze(this.playerId);
        });
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

        if (this.keyboard.cycleNpc && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminCycleNpcs();
        }

        if (this.keyboard.freezeCharacterMovement && !this.keyboard.didCycle)
        {
            this.keyboard.didCycle = true;
            this.adminFreezeCharacterMovement();
        }
    }

    spawnCharacter(characterData: any) {
        this.level.needsRedraw = true;

        let povExistsForPlayer = this.level.entities.findIndex(x => x instanceof Character && x.pov) != -1;
        let characterForPlayer = characterData.playerId == this.playerId;

        let pov = !povExistsForPlayer && characterForPlayer;
        var character = new Character(characterData.id, characterData.playerId,
                                      characterData.tileRow, characterData.tileCol,
                                      this.keyboard, characterData.imageName,
                                      pov, characterData.shareVision,
                                      characterData.imageFile, this.socket);
        this.level.addEntity(character);
        if (pov) {
            this.level.currentPovCharacter = character;
            this.camera.goToCharacter(character);
            
            if (!this.admin) {
                this.setCharacterPortraitButtonImage(character.image.src);
            }
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

    setCharacterPortraitButtonImage(src: string) {
        // another race condition workaround where the button may not exist when the first src comes in
        this.playerBtnSrc = src;
        let button = (document.getElementById('btn-current-portrait') as HTMLImageElement);
        if (button) {
            button.src = src;
        }
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

    createCharacterPortraitButton(): HTMLImageElement {
        let portraitButton = document.createElement('img');
        portraitButton.id = 'btn-current-portrait';
        portraitButton.role = 'button';
        portraitButton.src = this.playerBtnSrc;
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
                for (let i = 0; i < this.adminSpawnableNpcs.length; i++) {
                    document.getElementById(`btn-adminNpc-${this.adminSpawnableNpcs[i]}`).style.borderColor = 'black';
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
                for (let i = 0; i < this.adminPaintColors.length; i++) {
                    document.getElementById(`btn-adminColor-${this.adminPaintColors[i].name}`).style.borderColor = 'black';
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
            button.id = `btn-portrait-${this.heroPortraitNames[i]}`;
            button.src = ImageBank.getImageUrl(this.heroPortraitNames[i]);
            button.role = 'button';
            button.style.border = 'solid 3px';
            button.style.width = '48px';
            button.style.height = '48px';
            button.style.userSelect = 'none';
            button.style.margin = '2px';
            button.style.cursor = 'pointer';

            button.addEventListener('click', e => {
                (document.getElementById('custom-image') as HTMLInputElement).value = null;
                let src = ImageBank.getImageUrl(this.heroPortraitNames[i]);
                this.level.currentPovCharacter.image.src = src;
                this.setCharacterPortraitButtonImage(src);
                this.socket.emit('change-image', { characterId: this.level.currentPovCharacter.id, name: this.heroPortraitNames[i]});
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
                this.level.currentPovCharacter.image.src = src;
                this.setCharacterPortraitButtonImage(src);
                this.socket.emit('change-image', { characterId: this.level.currentPovCharacter.id, file: input.files[0]});
            }
        });
        button.appendChild(input);

        portrait.appendChild(button);

        return portrait;
    }
}