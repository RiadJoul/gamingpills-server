import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class BetsStats {
  @Field(() => Number)
  active: Number;
  @Field(() => Number)
  today: Number;
  @Field(() => Number)
  allTime: Number;
}