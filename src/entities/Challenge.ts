import { Entity, Enum, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Mode, Platform, Status } from "../enums/Challenge";
import { Field, ObjectType } from "type-graphql";
import { User } from "./User";
import { Game } from "./Game";
import { GameMode } from "./GameMode";


@ObjectType()
@Entity()
export class Challenge {
  @Field(() => String)
  @PrimaryKey({ type: "text", unique: true, autoincrement: false })
  id: string;

  @Field(() => Status , { nullable: true })
  @Enum(() => Status)
  status: Status;

  @Field(() => Mode)
  @Enum(() => Mode)
  mode: Mode;

  @Field(() => User)
  @ManyToOne(() => User)
  homePlayer: User;

  @Field(() => Number, { nullable: true })
  @Property({ type: "number", nullable: true })
  homeScore?: number;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  awayPlayer?: User;

  @Field(() => Number, { nullable: true })
  @Property({ type: "number", nullable: true })
  awayScore?: number;

  @Field(() => Platform)
  @Enum(() => Platform)
  platform!: Platform;

  @Field(() => Game)
  @ManyToOne(() => Game)
  game: Game;

  @Field(() => GameMode)
  @ManyToOne(() => GameMode)
  gameMode: GameMode;

  @Field(() => Number)
  @Property({ type: "number" })
  bet!: number;

  @Field(() => String, { nullable: true })
  @Property({ type: "text", nullable: true })
  comment?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  winner?: User;

  @Field(() => Date)
  @Property({ type: "date" })
  createdAt: Date = new Date();

  @Field(() => Date)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
