export interface CharacterState {
    id: string;
    tileRow: number;
    tileCol: number;
    shareVision: boolean;
    imageName: string;
    imageFile?: ArrayBuffer;
}