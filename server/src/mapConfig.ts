import fs from 'node:fs';
import { PNG } from 'pngjs';

export class MapConfig {
    mapName: string;
    enemies: any[];
    playerSpawns: any[];
    mapWidth?: number;
    mapHeight?: number;
    mapData?: string[];

    static load(config: MapConfig): Promise<MapConfig> {
        return new Promise((resolve, reject) => {
            let path = `src/assets/maps/${config.mapName}`;

            fs.createReadStream(path)
                .pipe(new PNG())
                .on("parsed", function () {
                    let pixels = [];
                    for (let i = 0; i < this.data.length; i += 4) {
                        const r = this.data[i];
                        const g = this.data[i + 1];
                        const b = this.data[i + 2];
                        const a = this.data[i + 3];
                        pixels.push(`${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${a.toString(16).padStart(2, "0")}`);
                    }
                    config.mapData = pixels;
                    config.mapWidth = this.width;
                    config.mapHeight = this.height;
                    resolve(config);
                });
        });
    }

    static small: MapConfig = {
        mapName: 'small.png',
        enemies: [
            { imageName: 'bandit_fuselier', tileRow: 3, tileCol: 3 },
            { imageName: 'bandit_cutthroat', tileRow: 10, tileCol: 10 }
        ],
        playerSpawns: [
            { imageName: 'highwayman', tileRow: 4, tileCol: 2 },
            { imageName: 'hellion', tileRow: 2, tileCol: 2 },
            { imageName: 'jester', tileRow: 2, tileCol: 4 },
            { imageName: 'occultist', tileRow: 4, tileCol: 4 }
        ]
    };

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
            { imageName: 'cultist_brawler', tileRow: 18, tileCol: 19 },
            { imageName: 'cultist_brawler', tileRow: 18, tileCol: 23 },
            { imageName: 'cultist_acolyte', tileRow: 12, tileCol: 19 },
            { imageName: 'cultist_acolyte', tileRow: 12, tileCol: 23 },
            { imageName: 'bone_soldier', tileRow: 23, tileCol: 42 },
            { imageName: 'bone_defender', tileRow: 24, tileCol: 42 },
            { imageName: 'bone_arbalist', tileRow: 22, tileCol: 46 },
            { imageName: 'bone_arbalist', tileRow: 26, tileCol: 46 },
            { imageName: 'bone_courtier', tileRow: 29, tileCol: 43 },
            { imageName: 'madman', tileRow: 51, tileCol: 7 },
            { imageName: 'madman', tileRow: 55, tileCol: 7 },
            { imageName: 'goul', tileRow: 55, tileCol: 30 },
            { imageName: 'bone_rabble', tileRow: 54, tileCol: 29 },
            { imageName: 'bone_rabble', tileRow: 52, tileCol: 28 },
            { imageName: 'bone_rabble', tileRow: 58, tileCol: 27 }
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