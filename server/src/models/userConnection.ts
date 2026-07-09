import { CharacterState } from "./characterState";

export interface UserConnection {
    id: string;
    socketIds: string[];
    controlableCharacters: CharacterState[];
}