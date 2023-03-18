import { Migration } from '@mikro-orm/migrations';

export class Migration20230318162453 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "notification" add column "is_read" boolean not null default false;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "notification" drop column "is_read";');
  }

}
