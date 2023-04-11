import { User } from "../../entities/User";
import { ObjectType, Field } from "type-graphql";
import { Transaction } from "../../entities/Transaction";

@ObjectType()
export class ManagePlayersResponse {
  @Field(() => [User])
  activePlayers: User[];

  @Field(() => [User])
  bannedPlayers: User[];

  @Field(() => [Transaction])
  pendingWithdraws: Transaction[];
  
  @Field(() => Number)
  onlinePlayersCount: number

  @Field(() => Number)
  totalBalances: number

  @Field(() => Number)
  pendingWithdrawsCount:number

  @Field(() => Number)
  bannedPlayersCount: number;
}