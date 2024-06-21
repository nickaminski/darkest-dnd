import { DrawContext } from './graphics/drawContext';
import { Mouse } from './input/mouse';
import { Level } from './level/level';
import { Keyboard } from './input/keyboard';
import { Camera } from './entity/camera';
import { Character } from './entity/character';

import { Socket } from 'socket.io-client';
import { PaintColor } from './graphics/paintColor';
import { ImageBank } from './graphics/imageBank';
import { UIFactory } from './input/uiFactory';

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
            this.level.currentPovCharacter = npcs[idx];
            this.setCharacterPortraitButtonImage(this.level.currentPovCharacter.image.src);
        } else if (this.admin) {
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
            this.level.currentPovCharacter = characters[0];
            this.camera.goToCharacter(characters[0]);
            
            if (!this.admin) {
                this.setCharacterPortraitButtonImage(characters[0].image.src);
            }
        }
        
        if (playerData.admin) {
            UIFactory.createAdminControls(this.adminSpawnableNpcs,
                                          this.adminPaintColors,
                                          this.updateNpcSpawnIdx,
                                          this.updateColorIdx);
        } else {
            UIFactory.createUserControls(this.heroPortraitNames,
                                         this.playerBtnSrc,
                                         this.userControlsCallback);
        }
    }

    updateNpcSpawnIdx = (idx: number) => {
        this.adminCurrentNpcSpawnIdx = idx;
    }

    updateColorIdx = (idx: number) => {
        this.adminCurrentColorIdx = idx;
    }

    userControlsCallback = (src: string, file: File | string) => {
        this.level.currentPovCharacter.image.src = src;
        this.setCharacterPortraitButtonImage(src);

        if (file instanceof File)
            this.socket.emit('change-image', { characterId: this.level.currentPovCharacter.id, file: file});
        else
            this.socket.emit('change-image', { characterId: this.level.currentPovCharacter.id, name: file});
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

        let povExistsForPlayer = this.level.currentPovCharacter != null;
        let characterForPlayer = characterData.playerId == this.playerId;

        let pov = !povExistsForPlayer && characterForPlayer;
        var character = new Character(characterData.id, characterData.playerId,
                                      characterData.tileRow, characterData.tileCol,
                                      this.keyboard, characterData.imageName,
                                      characterData.shareVision,
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

    setCharacterPortraitButtonImage(src: string) {
        // another race condition workaround where the button may not exist when the first src comes in
        this.playerBtnSrc = src;
        let button = (document.getElementById('btn-current-portrait') as HTMLImageElement);
        if (button) {
            button.src = src;
        }
    }
}