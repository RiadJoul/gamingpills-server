import { User } from "../../entities/User";
import { ObjectType, Field } from "type-graphql";
import { Game } from "../../entities/Game";
import { Challenge } from "../../entities/Challenge";
import { PaginatedChallenges } from "./PaginatedChallenges";

@ObjectType()
export class FeedResponse {
  @Field(() => [User])
  onlineUsers: User[];

  @Field(() => [Game])
  games: Game[];

  @Field(() => [Challenge],{nullable:true})
  myChallenges: Challenge[];

  @Field(() => PaginatedChallenges)
  challenges: PaginatedChallenges;
}