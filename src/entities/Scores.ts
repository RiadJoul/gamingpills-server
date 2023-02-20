import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";
import { Challenge } from "./Challenge";
import { User } from "./User";

@ObjectType()
@Entity()
export class Scores {
  @Field()
  @PrimaryKey()
  id: number;

  @ManyToOne(() => Challenge)
  challenge: Challenge;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Field(() => Number)
  @Property({ type: "number" })
  homeScore: number;

  @Field(() => Number)
  @Property({ type: "number" })
  awayScore: number;

  @Field(() => Date)
  @Property({ type: "date" })
  createdAt: Date = new Date();

  @Field(() => Date)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
