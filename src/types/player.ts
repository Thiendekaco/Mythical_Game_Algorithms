import { CardJson } from "./card";

export interface PlayerJson {
    name: string,
    score: number,
    cards: CardJson[]
}


export interface PlayerJoinGame extends PlayerJson{
    cardsPlayGame: CardJson[]
}