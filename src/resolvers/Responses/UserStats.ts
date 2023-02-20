import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class UserStats {
  @Field(() => Number)
  matches: Number;
  @Field(() => Number)
  wins: Number;
  @Field(() => Number)
  losses: Number
}