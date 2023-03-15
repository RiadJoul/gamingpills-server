import { Migration } from '@mikro-orm/migrations';

export class Migration20230315205515 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "message" drop constraint "message_conversation_id_foreign";');

    this.addSql('alter table "message" alter column "conversation_id" type text using ("conversation_id"::text);');
    this.addSql('alter table "message" alter column "conversation_id" set not null;');
    this.addSql('alter table "message" add constraint "message_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "message" drop constraint "message_conversation_id_foreign";');

    this.addSql('alter table "message" alter column "conversation_id" type text using ("conversation_id"::text);');
    this.addSql('alter table "message" alter column "conversation_id" drop not null;');
    this.addSql('alter table "message" add constraint "message_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade on delete set null;');
  }

}
