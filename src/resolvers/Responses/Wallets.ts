import { User } from "../../entities/User";
import { ObjectType, Field } from "type-graphql";
import { Transaction } from "../../entities/Transaction";

@ObjectType()
export class Wallets {
  @Field(() => [User])
  users: User[];

  @Field(() => [Transaction])
  transactions: Transaction[];

  @Field(() => [Transaction])
  pendingWithdraws: Transaction[];
}