import { Migration } from '@mikro-orm/migrations';

export class Migration20230315150701 extends Migration {

  async up(): Promise<void> {
    this.addSql('drop table if exists "conversation_members" cascade;');
  }

  async down(): Promise<void> {
    this.addSql('create table "conversation_members" ("conversation_id" text not null, "user_id" text not null, constraint "conversation_members_pkey" primary key ("conversation_id", "user_id"));');

    this.addSql('alter table "conversation_members" add constraint "conversation_members_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade on delete cascade;');
    this.addSql('alter table "conversation_members" add constraint "conversation_members_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;');
  }

}
