import { Migration } from '@mikro-orm/migrations';

export class Migration20221108143447 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "challenge" alter column "created_at" type date using ("created_at"::date);');
    this.addSql('alter table "challenge" alter column "updated_at" type date using ("updated_at"::date);');
  }

  async down(): Promise<void> {
    this.addSql('alter table "challenge" alter column "created_at" type timestamptz(0) using ("created_at"::timestamptz(0));');
    this.addSql('alter table "challenge" alter column "updated_at" type timestamptz(0) using ("updated_at"::timestamptz(0));');
  }

}
