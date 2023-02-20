import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class ProfitsStats {
  @Field(() => Number)
  today: Number;
  @Field(() => Number)
  thisMonth: Number;
  @Field(() => Number)
  allTime: Number;
}