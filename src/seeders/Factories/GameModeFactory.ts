import { Factory } from '@mikro-orm/seeder';

import { GameMode } from '../../entities/GameMode';



export class GameModeFactory extends Factory<GameMode> {
  model = GameMode;

  definition(): Partial<GameMode> {
    return {
        name: "Online Seasons",
    };
  }
}