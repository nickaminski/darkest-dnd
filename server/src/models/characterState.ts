export interface CharacterState {
    id: string;
    playerId: string;
    tileRow: number;
    tileCol: number;
    shareVision: boolean;
    imageName: string;
    imagePixels?: ArrayBuffer;
}