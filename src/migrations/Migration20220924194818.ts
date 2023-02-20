import { Migration } from '@mikro-orm/migrations';

export class Migration20220924194818 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "challenge" add column "game_mode_id" int not null;');
    this.addSql('alter table "challenge" add constraint "challenge_game_mode_id_foreign" foreign key ("game_mode_id") references "game_mode" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "challenge" drop constraint "challenge_game_mode_id_foreign";');

    this.addSql('alter table "challenge" drop column "game_mode_id";');
  }

}
