import { Factory } from '@mikro-orm/seeder';
import { Wallet } from '../../entities/Wallet';


export class WalletFactory extends Factory<Wallet> {
  model = Wallet;

  definition(): Partial<Wallet> {
    return {
        balance: 50
    };
  }
}