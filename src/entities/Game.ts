import { Entity, Enum, OneToMany, PrimaryKey, Property } from "@mikro-orm/core";
import { Category } from "../enums/Game";
import { ObjectType, Field } from "type-graphql";
import { GameMode } from "./GameMode";


@ObjectType()
@Entity()
export class Game {
  @Field()
  @PrimaryKey()
  id: number;

  @Field(() => Boolean,{ nullable: true })
  @Property({ type: "boolean" })
  active: boolean;

  @Field(() => Category, { nullable: true })
  @Enum(() => Category)
  category: Category;

  @Field(() => String)
  @Property({ type: "text" ,unique:true})
  name: string;

  @Field(() => String , { nullable: true })
  @Property({ type: "text" ,nullable: true})
  cover?: string;

  @Field(() => [GameMode],{nullable:true})
  @OneToMany(() => GameMode,(mode) => mode.Game)
  gameModes!: [GameMode];

  
  @Field(() => Date , { nullable: true })
  @Property({ type: "date" })
  createdAt: Date = new Date();

  @Field(() => Date , { nullable: true })
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}