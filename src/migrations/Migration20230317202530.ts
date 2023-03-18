import { Migration } from '@mikro-orm/migrations';

export class Migration20230317202530 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "notification" ("id" serial primary key, "user_id" text not null, "title" text not null, "message" text not null, "created_at" timestamptz(0) not null);');

    this.addSql('alter table "notification" add constraint "notification_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "notification" cascade;');
  }

}
