import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class WalletsStats {
  @Field(() => Number)
  totalBalance: Number;
  @Field(() => Number)
  pendingAmountWithdraws: Number;
  @Field(() => Number)
  totalDeposit: Number;
}