import { CardJson } from "../types";
import { BotCards } from "static";

export class CardStore {

    private _cards: CardJson[];


    constructor() {
        this._cards = BotCards;
    }

    getCardById(id: string): CardJson | undefined {
        return this._cards.find(card => card.def_id === id);
    }


    get cards(): CardJson[] {
        return this._cards;
    }

    set cards(value: CardJson[]) {
        this._cards = value;
    }
}