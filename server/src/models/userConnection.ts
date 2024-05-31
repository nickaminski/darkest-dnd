import { CharacterState } from "./characterState";

export interface UserConnection {
    id: string;
    socketIds: string[];
    ipAddress: string;
    admin: boolean;
    controlableCharacters: CharacterState[];
}