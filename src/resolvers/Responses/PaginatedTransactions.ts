import { Transaction } from "../../entities/Transaction";
import { ObjectType, Field } from "type-graphql";


@ObjectType()
export class PaginatedTransactions {
  @Field(() => [Transaction])
  transactions: Transaction[];

  @Field()
  hasMore: boolean;
}