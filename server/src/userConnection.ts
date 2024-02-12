export class UserConnection {
    id: string;
    socketIds: string[];
    ipAddress: string;
    currentTileRow: number;
    currentTileCol: number;
    admin: boolean;
}