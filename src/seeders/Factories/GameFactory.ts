import { Factory } from '@mikro-orm/seeder';
import { Category } from '../../enums/Game';
import { Game } from '../../entities/Game';



export class GameFactory extends Factory<Game> {
  model = Game;

  definition(): Partial<Game> {
    return {
        active:true,
        category: Category.SPORTS,
        name: "FIFA 23",
        cover: "https://images2.minutemediacdn.com/image/upload/c_crop,w_1013,h_1350,x_43,y_0/c_fill,w_720,ar_3:4,f_auto,q_auto,g_auto/images/voltaxMediaLibrary/mmsport/90min_en_international_web/01g8av5s8m4g8g0dr6we.jpg",
    };
  }
}