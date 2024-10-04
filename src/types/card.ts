

export interface CardJson {
    def_id: string,
    first_name: string,
    last_name: string,
    team: string,
    position: string,
    rarity: string,
    card: string,
    stars: number,
    level: number,
    power: number,
    strength_rating: number,
    quickness_rating: number,
    acceleration_rating: number,
    presence_rating: number,
    endurance_rating: number,
    jump_rating: number,
    carry_rating: number
}

export enum StatCard {
    STRENGTH = 'strength_rating',
    QUICKNESS = 'quickness_rating',
    ACCELERATION = 'acceleration_rating',
    PRESENCE = 'presence_rating',
    ENDURANCE = 'endurance_rating',
    JUMP = 'jump_rating',
    CARRY = 'carry_rating',
    POWER = 'power'

}