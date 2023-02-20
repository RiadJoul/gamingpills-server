import { Entity, Enum, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";
import { Status, Type } from "../enums/Transaction";
import { User } from "./User";

@ObjectType()
@Entity()
export class Transaction {
  @Field()
  @PrimaryKey()
  id: number;

  @Field(() => Status)
  @Enum(() => Status)
  status: Status;

  @Field(() => Type)
  @Enum(() => Type)
  type: Type;

  @Field(() => User)
  @ManyToOne(() => User)
  user: User;

  @Field(() => Number)
  @Property({ type: "number" })
  amount: number;

  @Field(() => String)
  @Property({ type: "text" })
  description: string;

  @Field(() => Date)
  @Property({ type: "date" })
  createdAt: Date = new Date();

  @Field(() => Date)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
