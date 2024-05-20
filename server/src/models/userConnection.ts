export interface UserConnection {
    id: string;
    socketIds: string[];
    ipAddress: string;
    imageName: string;
    currentTileRow: number;
    currentTileCol: number;
    admin: boolean;
    shareVision: boolean;
    imageFile?: ArrayBuffer;
}