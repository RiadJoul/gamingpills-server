import { User } from "../../entities/User";
import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class ManagePlayersResponse {
  @Field(() => [User])
  activePlayers: User[];

  @Field(() => [User])
  bannedPlayers: User[];

  @Field(() => Number)
  onlinePlayersCount: number

  @Field(() => Number)
  totalBalances: number

  @Field(() => Number)
  todayTotalDeposits:number

  @Field(() => Number)
  bannedPlayersCount: number;
}