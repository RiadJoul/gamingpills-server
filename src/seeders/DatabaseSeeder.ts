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
import { Category } from '../enums/Game';
import { ChallengeFactory } from './Factories/ChallengeFactory';
import { Game } from '../entities/Game';

export class DatabaseSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {

    const adminExists = await em.findOne(User, { role: Role.ADMIN });

    if (!adminExists) {
      new AdminFactory(em).makeOne();
    }

    if (!__prod__) {
      //TODO:remove this after testing
      const userExists = await em.findOne(User, { role: Role.PLAYER });

      const games = await em.find(Game, {}, {
        populate: ['gameModes'],
      });

      if (userExists) {
        const users = await em.find(User, {});



        users.filter(user => user.role == Role.PLAYER).forEach(player => {
          const challenge = new ChallengeFactory(em).makeOne();
          const randomGame = games[0];
          const randomGameMode = randomGame.gameModes[0];
          challenge.game = randomGame;
          challenge.gameMode = randomGameMode;
          challenge.homePlayer = player
        });


        
      }

      else {
        const fifa23 = new GameFactory(em).createOne({
          active: true,
          category: Category.SPORTS,
          name: "FIFA 23",
          cover: "https://images2.minutemediacdn.com/image/upload/c_crop,w_1013,h_1350,x_43,y_0/c_fill,w_720,ar_3:4,f_auto,q_auto,g_auto/images/voltaxMediaLibrary/mmsport/90min_en_international_web/01g8av5s8m4g8g0dr6we.jpg",
        });

        new GameModeFactory(em).createOne({
          name: "Online Seasons",
          Game: await fifa23
        });

        new GameModeFactory(em).createOne({
          name: "Ultimate Teams",
          Game: await fifa23
        });


        const nba2k23 = new GameFactory(em).createOne({
          active: true,
          category: Category.SPORTS,
          name: "NBA 2K23",
          cover: "https://manofmany.com/wp-content/uploads/2022/07/NBA-2K23-Digital-Edition-Cover.png",
        });


        new GameModeFactory(em).createOne({
          name: "1v1",
          Game: await nba2k23
        });

        new PlayerFactory(em).each(player => {
          player.Wallet = new WalletFactory(em).makeOne();
        }).make(20);


        
      }








    }


  }

}
