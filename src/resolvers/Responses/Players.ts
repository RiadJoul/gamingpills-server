import { User } from "../../entities/User";
import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class Players {
  @Field(() => [User])
  activePlayers: User[];

  @Field(() => [User])
  bannedPlayers: User[];
}