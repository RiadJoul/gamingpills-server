import { Migration } from '@mikro-orm/migrations';

export class Migration20220924193505 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "game" ("id" serial primary key, "active" boolean not null, "category" text check ("category" in (\'Sports\')) not null, "name" text not null, "cover" text null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');
    this.addSql('alter table "game" add constraint "game_name_unique" unique ("name");');

    this.addSql('create table "game_mode" ("id" serial primary key, "game_id" int not null, "name" text not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');

    this.addSql('create table "user" ("id" text not null, "role" text check ("role" in (\'Admin\', \'Player\')) not null, "banned" boolean not null, "username" text not null, "first_name" text not null, "last_name" text not null, "birth_date" timestamptz(0) not null, "email" text not null, "email_verified" boolean not null, "password" text not null, "psn_id" text null, "xbox_id" text null, "avatar" text null, "paypal" text null, "last_seen" timestamptz(0) null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');
    this.addSql('alter table "user" add constraint "user_username_unique" unique ("username");');
    this.addSql('alter table "user" add constraint "user_email_unique" unique ("email");');
    this.addSql('alter table "user" add constraint "user_pkey" primary key ("id");');

    this.addSql('create table "challenge" ("id" text not null, "status" text check ("status" in (\'Pending\', \'Active\', \'Finished\', \'Cancelled\', \'Disputed\')) not null, "mode" text check ("mode" in (\'Open\', \'Challenge\')) not null, "home_player_id" text not null, "home_score" int null, "away_player_id" text null, "away_score" int null, "platform" text check ("platform" in (\'Playstation 4\', \'Playstation 5\', \'XBOX ONE\', \'XBOX SERIES X/S\')) not null, "game_id" int not null, "bet" int not null, "comment" text null, "winner_id" text null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');
    this.addSql('alter table "challenge" add constraint "challenge_pkey" primary key ("id");');

    this.addSql('create table "wallet" ("id" serial primary key, "user_id" text not null, "balance" int not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');
    this.addSql('alter table "wallet" add constraint "wallet_user_id_unique" unique ("user_id");');

    this.addSql('create table "scores" ("id" serial primary key, "challenge_id" text not null, "user_id" text null, "home_score" int not null, "away_score" int not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');

    this.addSql('create table "transaction" ("id" serial primary key, "status" text check ("status" in (\'Pending\', \'Completed\', \'Rejected\')) not null, "type" text check ("type" in (\'Positive\', \'Negative\')) not null, "user_id" text not null, "amount" int not null, "description" text not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');

    this.addSql('alter table "game_mode" add constraint "game_mode_game_id_foreign" foreign key ("game_id") references "game" ("id") on update cascade;');

    this.addSql('alter table "challenge" add constraint "challenge_home_player_id_foreign" foreign key ("home_player_id") references "user" ("id") on update cascade;');
    this.addSql('alter table "challenge" add constraint "challenge_away_player_id_foreign" foreign key ("away_player_id") references "user" ("id") on update cascade on delete set null;');
    this.addSql('alter table "challenge" add constraint "challenge_game_id_foreign" foreign key ("game_id") references "game" ("id") on update cascade;');
    this.addSql('alter table "challenge" add constraint "challenge_winner_id_foreign" foreign key ("winner_id") references "user" ("id") on update cascade on delete set null;');

    this.addSql('alter table "wallet" add constraint "wallet_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;');

    this.addSql('alter table "scores" add constraint "scores_challenge_id_foreign" foreign key ("challenge_id") references "challenge" ("id") on update cascade;');
    this.addSql('alter table "scores" add constraint "scores_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete set null;');

    this.addSql('alter table "transaction" add constraint "transaction_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;');

    this.addSql('drop table if exists "challenge_game" cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "game_mode" drop constraint "game_mode_game_id_foreign";');

    this.addSql('alter table "challenge" drop constraint "challenge_game_id_foreign";');

    this.addSql('alter table "challenge" drop constraint "challenge_home_player_id_foreign";');

    this.addSql('alter table "challenge" drop constraint "challenge_away_player_id_foreign";');

    this.addSql('alter table "challenge" drop constraint "challenge_winner_id_foreign";');

    this.addSql('alter table "wallet" drop constraint "wallet_user_id_foreign";');

    this.addSql('alter table "scores" drop constraint "scores_user_id_foreign";');

    this.addSql('alter table "transaction" drop constraint "transaction_user_id_foreign";');

    this.addSql('alter table "scores" drop constraint "scores_challenge_id_foreign";');

    this.addSql('create table "challenge_game" ("challenge_id" text not null default null, "game_id" int4 not null default null);');
    this.addSql('alter table "challenge_game" add constraint "challenge_game_pkey" primary key ("challenge_id", "game_id");');

    this.addSql('drop table if exists "game" cascade;');

    this.addSql('drop table if exists "game_mode" cascade;');

    this.addSql('drop table if exists "user" cascade;');

    this.addSql('drop table if exists "challenge" cascade;');

    this.addSql('drop table if exists "wallet" cascade;');

    this.addSql('drop table if exists "scores" cascade;');

    this.addSql('drop table if exists "transaction" cascade;');
  }

}
