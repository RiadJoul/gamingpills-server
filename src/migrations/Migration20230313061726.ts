import { Migration } from '@mikro-orm/migrations';

export class Migration20230313061726 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "message" add column "content" text not null, add column "created_at" timestamptz(0) not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "message" drop column "content";');
    this.addSql('alter table "message" drop column "created_at";');
  }

}
