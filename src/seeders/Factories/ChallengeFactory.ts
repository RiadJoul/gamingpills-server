import { Factory } from '@mikro-orm/seeder';
import { Challenge } from '../../entities/Challenge';
import { v4 as uuidv4 } from "uuid";
import { Mode, Platform, Status } from '../../enums/Challenge';


export class ChallengeFactory extends Factory<Challenge> {
  model = Challenge;

  definition(): Partial<Challenge> {
    var uuid = uuidv4();
    return {
        id:uuid,
        status: Status.PENDING,
        mode: Mode.OPEN,
        platform: Platform.PS5,
        bet: 50
    };
  }
}