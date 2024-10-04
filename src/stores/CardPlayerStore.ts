import {CardJson} from "../types";
import { StartingPlayerCards } from "static";

export class CardPlayerStore {
      #cards: CardJson[];

    get cards(): CardJson[] {
        return this.#cards;
    }

    set cards(value: CardJson[]) {
        this.#cards = value;
    }

    constructor() {
        this.#cards = StartingPlayerCards;

    }
}