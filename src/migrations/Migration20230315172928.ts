import { Migration } from '@mikro-orm/migrations';

export class Migration20230315172928 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "message" alter column "id" type text using ("id"::text);');
    this.addSql('alter table "message" alter column "id" drop default;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "message" alter column "id" type int using ("id"::int);');
    this.addSql('create sequence if not exists "message_id_seq";');
    this.addSql('select setval(\'message_id_seq\', (select max("id") from "message"));');
    this.addSql('alter table "message" alter column "id" set default nextval(\'message_id_seq\');');
  }

}
