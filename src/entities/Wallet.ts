import {
  Entity,
  OneToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
export class Wallet {
  @Field()
  @PrimaryKey()
  id: number;

  @OneToOne(() => User)
  user: User;

  @Field(() => Number)
  @Property({ type: "number" })
  balance: number = 0;

  @Field(() => Date, { nullable: true })
  @Property({ type: "date" })
  createdAt: Date = new Date();

  @Field(() => Date, { nullable: true })
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}