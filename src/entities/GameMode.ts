import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";
import { Game } from "./Game";

@ObjectType()
@Entity()
export class GameMode {
  @Field()
  @PrimaryKey()
  id: number;

  @Field(() => Game,{nullable:true})
  @ManyToOne(() => Game)
  Game: Game;

  @Field(() => String)
  @Property({ type: "text" })
  name: string;

  @Field(() => Date, { nullable: true })
  @Property({ type: "date" })
  createdAt: Date = new Date();

  @Field(() => Date, { nullable: true })
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}