import { Migration } from '@mikro-orm/migrations';

export class Migration20230318200232 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "notification" alter column "id" type text using ("id"::text);');
    this.addSql('alter table "notification" alter column "id" drop default;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "notification" alter column "id" type int using ("id"::int);');
    this.addSql('create sequence if not exists "notification_id_seq";');
    this.addSql('select setval(\'notification_id_seq\', (select max("id") from "notification"));');
    this.addSql('alter table "notification" alter column "id" set default nextval(\'notification_id_seq\');');
  }

}
