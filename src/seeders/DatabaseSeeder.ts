import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { User } from '../entities/User';
import { __prod__ } from '../constants';
import { GameFactory } from './Factories/GameFactory';
import { GameModeFactory } from './Factories/GameModeFactory';
import { PlayerFactory } from './Factories/PlayerFactory';
import { WalletFactory } from './Factories/WalletFactory';
import { Role } from '../enums/Roles';
import { AdminFactory } from './Factories/AdminFactory';

export class DatabaseSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {

    const adminExists = await em.findOne(User, { role: Role.ADMIN });

    if (!adminExists) {
      new AdminFactory(em).makeOne();
    }

    if (!__prod__) {
      new PlayerFactory(em).each(player => {
        player.Wallet = new WalletFactory(em).makeOne();
      }).make(20);

      new GameFactory(em).each(game => {
        game.gameModes = [new GameModeFactory(em).makeOne()];
      }).make(1);
    }
    

  }

}
