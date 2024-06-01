import sizeof from 'image-size';
import fs from 'node:fs';

export class MapConfig {
    mapName: string;
    enemies: any[];
    playerSpawns: any[];
    mapWidth?: number;
    mapHeight?: number;
    mapData?: ArrayBuffer;

    static load(config: MapConfig): MapConfig {
        let path = `src/assets/maps/${config.mapName}`;
        config.mapData = fs.readFileSync(path);

        let dimensions = sizeof(path);
        config.mapWidth = dimensions.width;
        config.mapHeight = dimensions.height;

        return config;
    }

    static oldRoad: MapConfig = {
        mapName: 'old_road.png',
        enemies: [
            { imageName: 'bandit_fuselier', tileRow: 6, tileCol: 35 },
            { imageName: 'bandit_cutthroat', tileRow: 13, tileCol: 33 },
            { imageName: 'bandit_bloodletter', tileRow: 16, tileCol: 61 }
        ],
        playerSpawns: [
            { imageName: 'highwayman', tileRow: 4, tileCol: 2 },
            { imageName: 'hellion', tileRow: 2, tileCol: 2 },
            { imageName: 'jester', tileRow: 2, tileCol: 4 },
            { imageName: 'occultist', tileRow: 4, tileCol: 4 }
        ]
    };

    static wealdLv2 = {
        mapName: 'weald.png',
        enemies: [
            { imageName: 'spitter', tileRow: 38, tileCol: 54 },
            { imageName: 'spitter', tileRow: 38, tileCol: 54 },
            { imageName: 'webber', tileRow: 38, tileCol: 54 },
            { imageName: 'webber', tileRow: 38, tileCol: 54 },
            { imageName: 'fungal_scratcher', tileRow: 73, tileCol: 42 },
            { imageName: 'fungal_scratcher', tileRow: 73, tileCol: 42 },
            { imageName: 'fungal_artillery', tileRow: 73, tileCol: 42 },
            { imageName: 'fungal_artillery', tileRow: 73, tileCol: 42 },
            { imageName: 'large_slime', tileRow: 42, tileCol: 144 },
            { imageName: 'crone', tileRow: 39, tileCol: 138 },
            { imageName: 'abomination', tileRow: 47, tileCol: 74 }
        ],
        playerSpawns: [
            { imageName: 'highwayman', tileRow: 48, tileCol: 2 },
            { imageName: 'hellion', tileRow: 50, tileCol: 2 },
            { imageName: 'jester', tileRow: 50, tileCol: 4 },
            { imageName: 'occultist', tileRow: 48, tileCol: 4 }
        ]
    };

    static ruinsLv3 = {
        mapName: 'ruins.png',
        enemies: [
            { imageName: 'cultist_brawler', currentTileRow: 18, currentTileCol: 19 },
            { imageName: 'cultist_brawler', currentTileRow: 18, currentTileCol: 23 },
            { imageName: 'cultist_acolyte', currentTileRow: 12, currentTileCol: 19 },
            { imageName: 'cultist_acolyte', currentTileRow: 12, currentTileCol: 23 },
            { imageName: 'bone_soldier', currentTileRow: 23, currentTileCol: 42 },
            { imageName: 'bone_defender', currentTileRow: 24, currentTileCol: 42 },
            { imageName: 'bone_arbalist', currentTileRow: 22, currentTileCol: 46 },
            { imageName: 'bone_arbalist', currentTileRow: 26, currentTileCol: 46 },
            { imageName: 'bone_courtier', currentTileRow: 29, currentTileCol: 43 },
            { imageName: 'madman', currentTileRow: 51, currentTileCol: 7 },
            { imageName: 'madman', currentTileRow: 55, currentTileCol: 7 },
            { imageName: 'goul', currentTileRow: 55, currentTileCol: 30 },
            { imageName: 'bone_rabble', currentTileRow: 54, currentTileCol: 29 },
            { imageName: 'bone_rabble', currentTileRow: 52, currentTileCol: 28 },
            { imageName: 'bone_rabble', currentTileRow: 58, currentTileCol: 27 }
        ],
        playerSpawns: [
            { imageName: 'highwayman', tileRow: 1, tileCol: 9 },
            { imageName: 'hellion', tileRow: 1, tileCol: 10 },
            { imageName: 'jester', tileRow: 2, tileCol: 10 },
            { imageName: 'occultist', tileRow: 2, tileCol: 10 }
        ]
    };

    static ruinsLv4 = {
        mapName: 'ruins2.png',
        enemies: [
            { imageName: 'gargoyle', currentTileRow: 14, currentTileCol: 64 },
            { imageName: 'gargoyle', currentTileRow: 14, currentTileCol: 61 },
            { imageName: 'gargoyle', currentTileRow: 17, currentTileCol: 64 },
            { imageName: 'gargoyle', currentTileRow: 17, currentTileCol: 61 },
            { imageName: 'gargoyle', currentTileRow: 19, currentTileCol: 51 },
            { imageName: 'gargoyle', currentTileRow: 24, currentTileCol: 51 },
            { imageName: 'gargoyle', currentTileRow: 24, currentTileCol: 54 },
            { imageName: 'gargoyle', currentTileRow: 24, currentTileCol: 57 },
            { imageName: 'gargoyle', currentTileRow: 19, currentTileCol: 54 },
            { imageName: 'collector', currentTileRow: 11, currentTileCol: 14 },
            { imageName: 'prophet', currentTileRow: 41, currentTileCol: 28 },
            { imageName: 'madman', currentTileRow: 37, currentTileCol: 33 },
            { imageName: 'madman', currentTileRow: 40, currentTileCol: 30 },
            { imageName: 'cultist_acolyte', currentTileRow: 44, currentTileCol: 24 },
            { imageName: 'cultist_acolyte', currentTileRow: 39, currentTileCol: 22 }
        ],
        playerSpawns: [
            { imageName: 'highwayman', tileRow: 1, tileCol: 61 },
            { imageName: 'hellion', tileRow: 2, tileCol: 61 },
            { imageName: 'jester', tileRow: 3, tileCol: 61 },
            { imageName: 'occultist', tileRow: 4, tileCol: 61 }
        ]
    };
}