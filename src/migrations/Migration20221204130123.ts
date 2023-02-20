import { Migration } from '@mikro-orm/migrations';

export class Migration20221204130123 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" alter column "banned" type boolean using ("banned"::boolean);');
    this.addSql('alter table "user" alter column "banned" set default false;');
    this.addSql('alter table "user" alter column "email_verified" type boolean using ("email_verified"::boolean);');
    this.addSql('alter table "user" alter column "email_verified" set default false;');

    this.addSql('alter table "wallet" alter column "balance" type int using ("balance"::int);');
    this.addSql('alter table "wallet" alter column "balance" set default 0;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "user" alter column "banned" drop default;');
    this.addSql('alter table "user" alter column "banned" type boolean using ("banned"::boolean);');
    this.addSql('alter table "user" alter column "email_verified" drop default;');
    this.addSql('alter table "user" alter column "email_verified" type boolean using ("email_verified"::boolean);');

    this.addSql('alter table "wallet" alter column "balance" drop default;');
    this.addSql('alter table "wallet" alter column "balance" type int using ("balance"::int);');
  }

}
