import { Migration } from '@mikro-orm/migrations';

export class Migration20230311193411 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "conversation" ("id" text null, constraint "conversation_pkey" primary key ("id"));');

    this.addSql('create table "message" ("id" serial primary key, "conversation_id" text not null, "user_id" text not null);');

    this.addSql('alter table "message" add constraint "message_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade;');
    this.addSql('alter table "message" add constraint "message_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "message" drop constraint "message_conversation_id_foreign";');

    this.addSql('drop table if exists "conversation" cascade;');

    this.addSql('drop table if exists "message" cascade;');
  }

}
